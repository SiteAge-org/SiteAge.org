/**
 * Normalize a URL or domain string to a clean domain.
 * Strips protocol, www prefix, paths, ports, and query strings.
 */
export function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, "");

  // Remove www prefix
  domain = domain.replace(/^www\./, "");

  // Remove path, query, hash, port
  domain = domain.split("/")[0].split("?")[0].split("#")[0].split(":")[0];

  return domain;
}

/**
 * Validate that a string is a reasonable domain name.
 */
export function isValidDomain(domain: string): boolean {
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  return pattern.test(domain) && domain.length <= 253;
}

/**
 * Build the Wayback Machine URL for a given timestamp and domain.
 */
export function waybackUrl(timestamp: string, domain: string): string {
  return `https://web.archive.org/web/${timestamp}/https://${domain}`;
}
