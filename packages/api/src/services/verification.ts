import type { Env } from "../env.js";

/**
 * Generate a random token string.
 */
function generateToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a random magic key for management links.
 */
function generateMagicKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Initialize a verification for a domain.
 */
export async function initVerification(
  env: Env,
  domain: string,
  email: string,
  method: "dns_txt" | "meta_tag" | "well_known"
): Promise<{ token: string; instructions: string }> {
  // Ensure domain exists
  let domainRow = await env.DB.prepare("SELECT id FROM domains WHERE domain = ?").bind(domain).first();
  if (!domainRow) {
    await env.DB.prepare("INSERT INTO domains (domain, status) VALUES (?, 'unknown')").bind(domain).run();
    domainRow = await env.DB.prepare("SELECT id FROM domains WHERE domain = ?").bind(domain).first();
  }

  const domainId = domainRow!.id as number;
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Update domain verification status
  await env.DB.prepare(
    "UPDATE domains SET verification_status = 'pending', updated_at = datetime('now') WHERE id = ?"
  ).bind(domainId).run();

  // Create verification record
  await env.DB.prepare(
    "INSERT INTO verifications (domain_id, email, method, token, status, expires_at) VALUES (?, ?, ?, ?, 'pending', ?)"
  ).bind(domainId, email, method, token, expiresAt).run();

  let instructions: string;
  if (method === "dns_txt") {
    instructions = `Add a DNS TXT record to ${domain}:\n\nName: @ (or ${domain})\nValue: siteage-verify=${token}\n\nNote: DNS changes may take up to 24 hours to propagate. The token expires in 24 hours.`;
  } else if (method === "well_known") {
    instructions = `Create a file at https://${domain}/.well-known/siteage-verify.txt with the following content:\n\n${token}\n\nThe file must be publicly accessible. The token expires in 24 hours.`;
  } else {
    instructions = `Add the following meta tag to the <head> of your homepage at https://${domain}/:\n\n<meta name="siteage-verify" content="${token}">\n\nThe token expires in 24 hours.`;
  }

  return { token, instructions };
}

/**
 * Check verification status by querying DNS or meta tag.
 */
export async function checkVerification(
  env: Env,
  domain: string,
  token: string
): Promise<{ verified: boolean; message: string; magicKey?: string }> {
  // Find the verification record
  const verification = await env.DB.prepare(
    `SELECT v.*, d.id as domain_id FROM verifications v
     JOIN domains d ON v.domain_id = d.id
     WHERE d.domain = ? AND v.token = ? AND v.status = 'pending'
     ORDER BY v.created_at DESC LIMIT 1`
  ).bind(domain, token).first();

  if (!verification) {
    return { verified: false, message: "Verification not found or expired" };
  }

  // Check expiration
  if (new Date(verification.expires_at as string) < new Date()) {
    return { verified: false, message: "Verification token has expired. Please start a new verification." };
  }

  // Update last attempt
  await env.DB.prepare(
    "UPDATE verifications SET last_attempt_at = datetime('now') WHERE id = ?"
  ).bind(verification.id).run();

  const method = verification.method as string;
  const tokenPrefix = token.substring(0, 8);
  let found = false;

  console.info(`[Verify] Starting ${method} verification for ${domain} (token=${tokenPrefix}...)`);

  if (method === "dns_txt") {
    found = await checkDnsTxt(domain, token);
  } else if (method === "well_known") {
    found = await checkWellKnown(domain, token);
  } else {
    found = await checkMetaTag(domain, token);
  }

  console.info(`[Verify] ${method} result for ${domain}: ${found ? "FOUND" : "NOT FOUND"}`);

  const methodLabel = method === "dns_txt" ? "DNS TXT record" : method === "well_known" ? "verification file" : "meta tag";
  if (!found) {
    return { verified: false, message: `Verification record not found. Please ensure the ${methodLabel} is correctly configured.` };
  }

  // Verification successful
  const magicKey = generateMagicKey();

  await env.DB.prepare(
    "UPDATE verifications SET status = 'verified', verified_at = datetime('now'), magic_key = ? WHERE id = ?"
  ).bind(magicKey, verification.id).run();

  await env.DB.prepare(
    "UPDATE domains SET verification_status = 'verified', updated_at = datetime('now') WHERE id = ?"
  ).bind(verification.domain_id).run();

  // Clear all caches (API + Badge)
  await Promise.all([
    env.API_CACHE.delete(`lookup:${domain}`),
    env.API_CACHE.delete(`domain:${domain}`),
    env.BADGE_CACHE.delete(`domain:${domain}`),
  ]);

  // Send magic link email asynchronously (don't block response)
  sendMagicLinkEmail(env, verification.email as string, domain, magicKey).catch((err) => {
    console.error("Failed to send magic link email:", err);
  });

  return { verified: true, message: "Verification successful! Redirecting to management page...", magicKey };
}

/**
 * Resend magic link to a previously verified email.
 */
export async function resendMagicLink(
  env: Env,
  domain: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  const verification = await env.DB.prepare(
    `SELECT v.* FROM verifications v
     JOIN domains d ON v.domain_id = d.id
     WHERE d.domain = ? AND v.email = ? AND v.status = 'verified'
     ORDER BY v.verified_at DESC LIMIT 1`
  ).bind(domain, email).first();

  if (!verification) {
    return { success: false, message: "No verified record found for this domain and email." };
  }

  // Generate new magic key
  const magicKey = generateMagicKey();
  await env.DB.prepare(
    "UPDATE verifications SET magic_key = ? WHERE id = ?"
  ).bind(magicKey, verification.id).run();

  await sendMagicLinkEmail(env, email, domain, magicKey);

  return { success: true, message: "A new management link has been sent to your email." };
}

/**
 * Parse raw TXT record data from DoH response.
 * Handles quoted strings, multi-segment TXT records ("seg1" "seg2"), and whitespace.
 */
export function parseTxtData(raw: string): string {
  // Extract all quoted segments and concatenate them
  const segments: string[] = [];
  const regex = /"([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    segments.push(match[1]);
  }
  if (segments.length > 0) {
    return segments.join("").trim();
  }
  // Fallback: no quotes found, use raw value trimmed
  return raw.trim();
}

export interface DohResult {
  provider: string;
  status: number;
  dnsStatus: number;
  records: string[];
  error?: string;
}

/**
 * Query TXT records from a DoH provider. Returns structured result.
 */
export async function queryDohTxt(domain: string, dohBase: string, provider: string): Promise<DohResult> {
  try {
    const url = `${dohBase}?name=${encodeURIComponent(domain)}&type=TXT`;
    const resp = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.warn(`[DNS] ${provider} HTTP error: ${resp.status} for ${domain}`);
      return { provider, status: resp.status, dnsStatus: -1, records: [], error: `HTTP ${resp.status}` };
    }

    const data = await resp.json() as { Status?: number; Answer?: Array<{ data: string }> };
    const dnsStatus = data.Status ?? -1;

    if (dnsStatus !== 0) {
      console.warn(`[DNS] ${provider} DNS Status=${dnsStatus} for ${domain} (0=NOERROR, 2=SERVFAIL, 3=NXDOMAIN)`);
    }

    const records = (data.Answer || []).map((a) => parseTxtData(a.data));
    console.info(`[DNS] ${provider} returned ${records.length} TXT record(s) for ${domain}: ${JSON.stringify(records)}`);

    return { provider, status: resp.status, dnsStatus, records };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DNS] ${provider} query failed for ${domain}: ${message}`);
    return { provider, status: -1, dnsStatus: -1, records: [], error: message };
  }
}

/**
 * Query TXT records via system DNS resolver (node:dns).
 * Uses dynamic import to avoid module-level dependency on node:dns types.
 * Includes a 5s timeout to prevent hanging in workerd environments.
 */
export async function querySystemDns(domain: string): Promise<DohResult> {
  try {
    const dns = await import("node:dns");
    const timeoutMs = 5000;
    const records: string[][] = await Promise.race([
      dns.promises.resolveTxt(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`System DNS timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    // resolveTxt returns string[][] — each entry is an array of segments
    const parsed = records.map((segments: string[]) => segments.join(""));
    console.info(`[DNS] System resolver returned ${parsed.length} TXT record(s) for ${domain}: ${JSON.stringify(parsed)}`);
    return { provider: "System", status: 200, dnsStatus: 0, records: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DNS] System resolver failed for ${domain}: ${message}`);
    return { provider: "System", status: -1, dnsStatus: -1, records: [], error: message };
  }
}

/** DoH providers to query in parallel. */
const DOH_PROVIDERS: Array<{ base: string; name: string }> = [
  { base: "https://cloudflare-dns.com/dns-query", name: "Cloudflare" },
  { base: "https://dns.google/resolve", name: "Google" },
  { base: "https://dns.alidns.com/resolve", name: "AliDNS" },
];

/**
 * Check DNS TXT records via multiple DoH providers (parallel) with system DNS fallback.
 */
async function checkDnsTxt(domain: string, token: string): Promise<boolean> {
  const target = `siteage-verify=${token}`;
  const tokenPrefix = token.substring(0, 8);

  // Query all DoH providers in parallel
  const dohResults = await Promise.all(
    DOH_PROVIDERS.map((p) => queryDohTxt(domain, p.base, p.name))
  );

  for (const result of dohResults) {
    if (result.records.some((r) => r === target)) {
      console.info(`[DNS] Match found via ${result.provider} for ${domain} (token=${tokenPrefix}...)`);
      return true;
    }
  }

  // Fallback to system DNS if ALL DoH providers had network errors
  const allDohFailed = dohResults.every((r) => !!r.error);
  if (allDohFailed) {
    console.info(`[DNS] All DoH resolvers failed, falling back to system DNS for ${domain}`);
    const sysResult = await querySystemDns(domain);
    if (sysResult.records.some((r) => r === target)) {
      console.info(`[DNS] Match found via system DNS for ${domain} (token=${tokenPrefix}...)`);
      return true;
    }
  }

  console.warn(`[DNS] No match from any resolver for ${domain} (token=${tokenPrefix}...). Expected: "${target}"`);
  return false;
}

/**
 * Check meta tag on the domain's homepage.
 */
async function checkMetaTag(domain: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://${domain}/`, {
      headers: { "User-Agent": "SiteAge.org Verification/1.0" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    if (!resp.ok) return false;

    const html = await resp.text();
    // Match <meta name="siteage-verify" content="TOKEN">
    const regex = /<meta\s+[^>]*name\s*=\s*["']siteage-verify["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/i;
    const altRegex = /<meta\s+[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']siteage-verify["'][^>]*>/i;

    const match = regex.exec(html) || altRegex.exec(html);
    return match ? match[1] === token : false;
  } catch {
    return false;
  }
}

/**
 * Check well-known verification file on the domain.
 */
async function checkWellKnown(domain: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://${domain}/.well-known/siteage-verify.txt`, {
      headers: { "User-Agent": "SiteAge.org Verification/1.0" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    if (!resp.ok) return false;

    const text = await resp.text();
    return text.trim() === token;
  } catch {
    return false;
  }
}

/**
 * Send magic link email via Resend.
 */
async function sendMagicLinkEmail(env: Env, email: string, domain: string, magicKey: string): Promise<void> {
  const manageUrl = `https://siteage.org/manage/${domain}?key=${magicKey}`;

  console.info(`[Email] Sending magic link for ${domain} to ${email}`);
  console.info(`[Email] Magic link URL: ${manageUrl}`);

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SiteAge.org <noreply@siteage.org>",
        to: [email],
        subject: `Management Link for ${domain} - SiteAge.org`,
        html: `
          <h2>Your SiteAge Management Link</h2>
          <p>You have successfully verified ownership of <strong>${domain}</strong>.</p>
          <p>Use the link below to manage your domain's settings on SiteAge.org:</p>
          <p><a href="${manageUrl}">${manageUrl}</a></p>
          <p>Keep this link safe — it grants access to your domain's management page.</p>
          <p>If you lost this link, you can request a new one at <a href="https://siteage.org/verify/${domain}">siteage.org/verify/${domain}</a>.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">SiteAge.org — Website Age Certification</p>
        `,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "unknown error");
      console.error(`[Email] Resend API returned ${resp.status}: ${body}`);
    } else {
      console.info(`[Email] Successfully sent magic link for ${domain}`);
    }
  } catch (err) {
    console.error(`[Email] Failed to send magic link for ${domain}:`, err);
  }
}
