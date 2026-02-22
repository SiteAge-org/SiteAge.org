import type { Env } from "../env.js";
import { TOMBSTONE_THRESHOLD, HEALTH_CHECK_TIMEOUT } from "@siteage/shared";
import type { CheckType } from "@siteage/shared";

interface CheckResult {
  statusCode: number | null;
  responseTimeMs: number | null;
  badgeDetected: boolean;
  dnsResolvable: boolean;
}

/**
 * Perform a health check on a domain.
 */
async function performCheck(domain: string): Promise<CheckResult> {
  const start = Date.now();

  try {
    const resp = await fetch(`https://${domain}/`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
      headers: { "User-Agent": "SiteAge.org HealthCheck/1.0" },
    });

    const responseTimeMs = Date.now() - start;
    let badgeDetected = false;

    // For successful responses, also check for badge embed
    if (resp.ok) {
      try {
        const getResp = await fetch(`https://${domain}/`, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
          headers: { "User-Agent": "SiteAge.org HealthCheck/1.0" },
        });
        if (getResp.ok) {
          const html = await getResp.text();
          badgeDetected = html.includes("badge.siteage.org");
        }
      } catch {
        // Non-critical
      }
    }

    return {
      statusCode: resp.status,
      responseTimeMs,
      badgeDetected,
      dnsResolvable: true,
    };
  } catch {
    // Check DNS resolution
    const dnsResolvable = await checkDns(domain);
    return {
      statusCode: null,
      responseTimeMs: null,
      badgeDetected: false,
      dnsResolvable,
    };
  }
}

/**
 * Check if a domain resolves via DNS (detect NXDOMAIN).
 */
async function checkDns(domain: string): Promise<boolean> {
  try {
    const resp = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!resp.ok) return false;
    const data = await resp.json() as { Status: number; Answer?: unknown[] };
    // Status 3 = NXDOMAIN
    return data.Status !== 3;
  } catch {
    return true; // Assume resolvable on error to avoid false tombstones
  }
}

/**
 * Run health check on a single domain and update D1.
 */
export async function checkDomain(
  env: Env,
  domainId: number,
  domainName: string,
  checkType: CheckType
): Promise<void> {
  const result = await performCheck(domainName);

  // Insert health check record
  await env.DB.prepare(
    "INSERT INTO health_checks (domain_id, status_code, response_time_ms, check_type, badge_detected) VALUES (?, ?, ?, ?, ?)"
  ).bind(domainId, result.statusCode, result.responseTimeMs, checkType, result.badgeDetected ? 1 : 0).run();

  const isSuccess = result.statusCode !== null && result.statusCode >= 200 && result.statusCode < 400;

  if (isSuccess) {
    // Success: reset failures, mark active
    await env.DB.prepare(
      `UPDATE domains SET
        status = 'active',
        consecutive_failures = 0,
        badge_embedded = ?,
        last_checked_at = datetime('now'),
        last_alive_at = datetime('now'),
        death_at = NULL,
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(result.badgeDetected ? 1 : 0, domainId).run();
  } else if (result.dnsResolvable) {
    // DNS resolves but HTTP fails: unreachable (don't increment failures)
    await env.DB.prepare(
      `UPDATE domains SET
        status = 'unreachable',
        last_checked_at = datetime('now'),
        updated_at = datetime('now')
       WHERE id = ?`
    ).bind(domainId).run();
  } else {
    // NXDOMAIN: increment failures
    const domain = await env.DB.prepare("SELECT consecutive_failures FROM domains WHERE id = ?").bind(domainId).first();
    const failures = ((domain?.consecutive_failures as number) || 0) + 1;

    if (failures >= TOMBSTONE_THRESHOLD) {
      // Trigger tombstone
      await env.DB.prepare(
        `UPDATE domains SET
          status = 'dead',
          death_at = datetime('now'),
          consecutive_failures = ?,
          last_checked_at = datetime('now'),
          updated_at = datetime('now')
         WHERE id = ?`
      ).bind(failures, domainId).run();

      // Clear caches so badge updates
      await env.API_CACHE.delete(`lookup:${domainName}`);
      await env.API_CACHE.delete(`domain:${domainName}`);
    } else {
      await env.DB.prepare(
        `UPDATE domains SET
          consecutive_failures = ?,
          last_checked_at = datetime('now'),
          updated_at = datetime('now')
         WHERE id = ?`
      ).bind(failures, domainId).run();
    }
  }
}
