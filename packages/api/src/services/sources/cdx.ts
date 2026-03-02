import { CDX_API_BASE, cdxTimestampToISO } from "@siteage/shared";
import type { DataSource, SourceResult } from "./types.js";

/**
 * CDX (Wayback Machine) data source adapter.
 * Wraps the existing queryCdx logic into the DataSource interface.
 */
export class CdxSource implements DataSource {
  readonly name = "cdx";
  private cdxBase?: string;

  constructor(cdxBase?: string) {
    this.cdxBase = cdxBase;
  }

  async query(domain: string): Promise<SourceResult> {
    const now = new Date().toISOString();
    const base = this.cdxBase || CDX_API_BASE;

    try {
      const url = `${base}?url=${encodeURIComponent(domain)}&output=json&filter=statuscode:200&limit=1&fl=timestamp,statuscode`;
      const response = await fetch(url, {
        headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errMsg = response.status === 429
          ? "CDX API rate limited"
          : `CDX API returned ${response.status}`;
        throw new Error(errMsg);
      }

      const data = await response.json() as string[][];
      if (!data || data.length < 2) {
        return {
          source: this.name,
          earliest_date: null,
          raw_data: { snapshot_count: 0 },
          confidence: "high",
          queried_at: now,
        };
      }

      const earliest = data[1][0];
      const earliestIso = cdxTimestampToISO(earliest);

      // Get approximate snapshot count
      let snapshotCount = 1;
      try {
        const countUrl = `${base}?url=${encodeURIComponent(domain)}&filter=statuscode:200&matchType=exact&showNumPages=true`;
        const countResp = await fetch(countUrl, {
          headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
          signal: AbortSignal.timeout(10000),
        });
        if (countResp.ok) {
          snapshotCount = Math.max(1, parseInt(await countResp.text(), 10));
        }
      } catch {
        // Non-critical
      }

      const firstSnapshotUrl = `https://web.archive.org/web/${earliest}/${domain}`;

      return {
        source: this.name,
        earliest_date: earliestIso,
        raw_data: {
          earliest_timestamp: earliest,
          snapshot_count: snapshotCount,
          first_snapshot_url: firstSnapshotUrl,
        },
        confidence: "high",
        queried_at: now,
      };
    } catch (err) {
      console.error(`[CDX] Query failed for ${domain}:`, err);
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
