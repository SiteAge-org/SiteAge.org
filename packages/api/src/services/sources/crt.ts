import { CRT_API_BASE, CRT_QUERY_TIMEOUT } from "@siteage/shared";
import type { DataSource, SourceResult } from "./types.js";

interface CrtEntry {
  id: number;
  issuer_ca_id: number;
  issuer_name: string;
  common_name: string;
  name_value: string;
  not_before: string;
  not_after: string;
  serial_number: string;
}

/**
 * Certificate Transparency (crt.sh) data source.
 * Queries crt.sh for the earliest SSL/TLS certificate issued for a domain.
 */
export class CrtSource implements DataSource {
  readonly name = "crt";

  async query(domain: string): Promise<SourceResult> {
    const now = new Date().toISOString();

    try {
      const url = `${CRT_API_BASE}/?q=${encodeURIComponent(domain)}&output=json`;
      const response = await fetch(url, {
        headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
        signal: AbortSignal.timeout(CRT_QUERY_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`crt.sh returned ${response.status}`);
      }

      const data = await response.json() as CrtEntry[];

      if (!data || data.length === 0) {
        return {
          source: this.name,
          earliest_date: null,
          raw_data: { cert_count: 0 },
          confidence: "medium",
          queried_at: now,
        };
      }

      // Filter to exact domain matches (exclude wildcard/subdomain noise)
      const domainLower = domain.toLowerCase();
      const relevant = data.filter((entry) => {
        const names = entry.name_value.toLowerCase().split("\n");
        return names.some(
          (n) => n === domainLower || n === `*.${domainLower}`,
        );
      });

      if (relevant.length === 0) {
        return {
          source: this.name,
          earliest_date: null,
          raw_data: { cert_count: 0, total_entries: data.length },
          confidence: "medium",
          queried_at: now,
        };
      }

      // Find earliest not_before date
      let earliestDate: Date | null = null;
      let earliestIssuer = "";
      for (const entry of relevant) {
        const d = new Date(entry.not_before);
        if (!isNaN(d.getTime()) && (!earliestDate || d < earliestDate)) {
          earliestDate = d;
          earliestIssuer = entry.issuer_name;
        }
      }

      if (!earliestDate) {
        return {
          source: this.name,
          earliest_date: null,
          raw_data: { cert_count: relevant.length },
          confidence: "medium",
          queried_at: now,
        };
      }

      return {
        source: this.name,
        earliest_date: earliestDate.toISOString(),
        raw_data: {
          cert_count: relevant.length,
          earliest_issuer: earliestIssuer,
        },
        confidence: "medium",
        queried_at: now,
      };
    } catch (err) {
      console.error(`[CRT] Query failed for ${domain}:`, err);
      return {
        source: this.name,
        earliest_date: null,
        raw_data: {},
        confidence: "medium",
        queried_at: now,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
