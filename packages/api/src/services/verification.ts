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
  method: "dns_txt" | "meta_tag"
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
): Promise<{ verified: boolean; message: string }> {
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
  let found = false;

  if (method === "dns_txt") {
    found = await checkDnsTxt(domain, token);
  } else {
    found = await checkMetaTag(domain, token);
  }

  if (!found) {
    return { verified: false, message: `Verification record not found. Please ensure the ${method === "dns_txt" ? "DNS TXT record" : "meta tag"} is correctly configured.` };
  }

  // Verification successful
  const magicKey = generateMagicKey();

  await env.DB.prepare(
    "UPDATE verifications SET status = 'verified', verified_at = datetime('now'), magic_key = ? WHERE id = ?"
  ).bind(magicKey, verification.id).run();

  await env.DB.prepare(
    "UPDATE domains SET verification_status = 'verified', updated_at = datetime('now') WHERE id = ?"
  ).bind(verification.domain_id).run();

  // Clear domain cache
  await env.API_CACHE.delete(`lookup:${domain}`);
  await env.API_CACHE.delete(`domain:${domain}`);

  // Send magic link email
  await sendMagicLinkEmail(env, verification.email as string, domain, magicKey);

  return { verified: true, message: "Verification successful! A management link has been sent to your email." };
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
 * Check DNS TXT records via Cloudflare DoH.
 */
async function checkDnsTxt(domain: string, token: string): Promise<boolean> {
  try {
    const resp = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!resp.ok) return false;

    const data = await resp.json() as { Answer?: Array<{ data: string }> };
    if (!data.Answer) return false;

    const target = `siteage-verify=${token}`;
    return data.Answer.some((a) => {
      // DNS TXT records may be quoted
      const value = a.data.replace(/^"|"$/g, "");
      return value === target;
    });
  } catch {
    return false;
  }
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
 * Send magic link email via Resend.
 */
async function sendMagicLinkEmail(env: Env, email: string, domain: string, magicKey: string): Promise<void> {
  const manageUrl = `https://siteage.org/manage/${domain}?key=${magicKey}`;

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
      console.error(`Resend API returned ${resp.status}: ${body}`);
    }
  } catch (err) {
    console.error("Failed to send magic link email:", err);
  }
}
