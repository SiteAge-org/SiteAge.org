import { RDAP_API_BASE, RDAP_QUERY_TIMEOUT } from "@siteage/shared";
import { WhoisSource } from "./whois.js";
import type { DataSource, SourceResult } from "./types.js";

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapEntity {
  vcardArray?: unknown[];
  roles?: string[];
}

interface RdapResponse {
  events?: RdapEvent[];
  entities?: RdapEntity[];
  nameservers?: Array<{ ldhName?: string }>;
}

/**
 * RDAP (Registration Data Access Protocol) data source.
 * Falls back to WHOIS via who-dat.as93.net if RDAP fails.
 */
export class RdapSource implements DataSource {
  readonly name = "rdap";

  async query(domain: string): Promise<SourceResult> {
    const now = new Date().toISOString();

    try {
      const result = await this.queryRdap(domain, now);
      return result;
    } catch (err) {
      console.error(`[RDAP] Query failed for ${domain}, falling back to WHOIS:`, err);

      // Fall back to WHOIS
      try {
        const whoisSource = new WhoisSource();
        const whoisResult = await whoisSource.query(domain);
        // Mark it as rdap source with whois fallback note
        return {
          ...whoisResult,
          source: this.name,
          raw_data: {
            ...whoisResult.raw_data,
            fallback: "whois",
            rdap_error: err instanceof Error ? err.message : String(err),
          },
        };
      } catch (whoisErr) {
        console.error(`[RDAP] WHOIS fallback also failed for ${domain}:`, whoisErr);
        return {
          source: this.name,
          earliest_date: null,
          raw_data: {
            rdap_error: err instanceof Error ? err.message : String(err),
            whois_error: whoisErr instanceof Error ? whoisErr.message : String(whoisErr),
          },
          confidence: "high",
          queried_at: now,
          error: `RDAP failed: ${err instanceof Error ? err.message : String(err)}; WHOIS fallback also failed`,
        };
      }
    }
  }

  private async queryRdap(domain: string, now: string): Promise<SourceResult> {
    const url = `${RDAP_API_BASE}/domain/${encodeURIComponent(domain)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SiteAge.org/1.0 (https://siteage.org)",
        Accept: "application/rdap+json",
      },
      signal: AbortSignal.timeout(RDAP_QUERY_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`RDAP returned ${response.status}`);
    }

    const data = await response.json() as RdapResponse;

    // Find registration event
    let registrationDate: string | null = null;
    let registrar = "";

    if (data.events) {
      for (const event of data.events) {
        if (event.eventAction === "registration") {
          registrationDate = new Date(event.eventDate).toISOString();
          break;
        }
      }
    }

    // Extract registrar from entities
    if (data.entities) {
      for (const entity of data.entities) {
        if (entity.roles?.includes("registrar") && entity.vcardArray) {
          const vcard = entity.vcardArray as unknown[][];
          if (vcard[1]) {
            for (const prop of vcard[1] as unknown[][]) {
              if (prop[0] === "fn") {
                registrar = prop[3] as string;
                break;
              }
            }
          }
          break;
        }
      }
    }

    const nameservers = data.nameservers?.map((ns) => ns.ldhName).filter(Boolean) ?? [];

    return {
      source: this.name,
      earliest_date: registrationDate,
      raw_data: {
        registrar,
        nameservers,
        event_count: data.events?.length ?? 0,
      },
      confidence: "high",
      queried_at: now,
    };
  }
}
