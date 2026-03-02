import type { DataSource } from "./types.js";
import { CdxSource } from "./cdx.js";
import { CrtSource } from "./crt.js";
import { RdapSource } from "./rdap.js";
import { CommonCrawlSource } from "./commoncrawl.js";

/**
 * Returns all active data sources for domain age lookup.
 * WHOIS is not included here — it's used as an internal fallback within RdapSource.
 */
export function getActiveSources(cdxBase?: string): DataSource[] {
  return [
    new CdxSource(cdxBase),
    new CrtSource(),
    new RdapSource(),
    new CommonCrawlSource(),
  ];
}
