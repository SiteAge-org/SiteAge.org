import { WHOIS_API_BASE, WHOIS_QUERY_TIMEOUT } from "@siteage/shared";
import type { DataSource, SourceResult } from "./types.js";

interface WhoIsResponse {
  domain?: string;
  created_date?: string;
  creation_date?: string;
  registrar?: string;
  [key: string]: unknown;
}

/**
 * WHOIS data source via who-dat.as93.net JSON API.
 * Used as a fallback when RDAP fails (not called directly in the registry).
 */
export class WhoisSource implements DataSource {
  readonly name = "whois";

  async query(domain: string): Promise<SourceResult> {
    const now = new Date().toISOString();

    try {
      const url = `${WHOIS_API_BASE}/${encodeURIComponent(domain)}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
        signal: AbortSignal.timeout(WHOIS_QUERY_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`WHOIS API returned ${response.status}`);
      }

      const data = await response.json() as WhoIsResponse;

      // Extract creation date (field name varies)
      const creationDateStr = data.created_date || data.creation_date;
      let creationDate: string | null = null;
      if (creationDateStr) {
        const parsed = new Date(creationDateStr);
        if (!isNaN(parsed.getTime())) {
          creationDate = parsed.toISOString();
        }
      }

      return {
        source: this.name,
        earliest_date: creationDate,
        raw_data: {
          registrar: data.registrar ?? "",
        },
        confidence: "high",
        queried_at: now,
      };
    } catch (err) {
      console.error(`[WHOIS] Query failed for ${domain}:`, err);
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
