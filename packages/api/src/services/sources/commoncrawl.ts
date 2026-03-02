import { COMMONCRAWL_INDEX_API, COMMONCRAWL_QUERY_TIMEOUT, cdxTimestampToISO } from "@siteage/shared";
import type { DataSource, SourceResult } from "./types.js";

interface CollInfo {
  id: string;
  name: string;
  timegate: string;
  "cdx-api": string;
}

interface CcCdxLine {
  timestamp?: string;
  url?: string;
  status?: string;
}

/**
 * Common Crawl data source.
 * Queries Common Crawl CDX indexes for the earliest crawl record of a domain.
 */
export class CommonCrawlSource implements DataSource {
  readonly name = "commoncrawl";

  async query(domain: string): Promise<SourceResult> {
    const now = new Date().toISOString();

    try {
      // Get available indexes
      const indexListResp = await fetch(`${COMMONCRAWL_INDEX_API}/collinfo.json`, {
        headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
        signal: AbortSignal.timeout(COMMONCRAWL_QUERY_TIMEOUT),
      });

      if (!indexListResp.ok) {
        throw new Error(`Common Crawl index list returned ${indexListResp.status}`);
      }

      const indexes = await indexListResp.json() as CollInfo[];
      if (!indexes || indexes.length === 0) {
        throw new Error("No Common Crawl indexes available");
      }

      // Query the earliest few indexes (sorted newest-first by CC, so take from the end)
      const earliestIndexes = indexes.slice(-5).reverse();

      let earliestTimestamp: string | null = null;
      let earliestIso: string | null = null;

      for (const index of earliestIndexes) {
        try {
          const cdxUrl = `${COMMONCRAWL_INDEX_API}/${index.id}-index?url=${encodeURIComponent(domain)}&output=json&limit=1`;
          const resp = await fetch(cdxUrl, {
            headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
            signal: AbortSignal.timeout(COMMONCRAWL_QUERY_TIMEOUT),
          });

          if (!resp.ok) continue;

          const text = await resp.text();
          if (!text.trim()) continue;

          // CC CDX returns NDJSON (one JSON per line)
          const firstLine = text.trim().split("\n")[0];
          const record = JSON.parse(firstLine) as CcCdxLine;

          if (record.timestamp) {
            const iso = cdxTimestampToISO(record.timestamp);
            if (!earliestIso || iso < earliestIso) {
              earliestTimestamp = record.timestamp;
              earliestIso = iso;
            }
          }
        } catch {
          // Individual index query failure is non-critical
          continue;
        }
      }

      return {
        source: this.name,
        earliest_date: earliestIso,
        raw_data: {
          earliest_timestamp: earliestTimestamp,
          indexes_queried: earliestIndexes.length,
        },
        confidence: "high",
        queried_at: now,
      };
    } catch (err) {
      console.error(`[CC] Query failed for ${domain}:`, err);
      return {
        source: this.name,
        earliest_date: null,
        raw_data: {},
        confidence: "high",
        queried_at: now,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
