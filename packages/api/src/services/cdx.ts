import { CDX_API_BASE, cdxTimestampToISO } from "@siteage/shared";

export interface CdxResult {
  earliest_timestamp: string | null;
  earliest_iso: string | null;
  snapshot_count: number;
}

/**
 * Query the Wayback Machine CDX API for the earliest 200 OK snapshot.
 * @param cdxBase - Optional CDX API base URL override (for local dev proxy)
 */
export async function queryCdx(domain: string, cdxBase?: string): Promise<CdxResult> {
  const base = cdxBase || CDX_API_BASE;
  const url = `${base}?url=${encodeURIComponent(domain)}&output=json&filter=statuscode:200&limit=1&fl=timestamp,statuscode`;

  const response = await fetch(url, {
    headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("CDX API rate limited");
    }
    throw new Error(`CDX API returned ${response.status}`);
  }

  const data = await response.json() as string[][];

  // First row is headers, data starts from index 1
  if (!data || data.length < 2) {
    return { earliest_timestamp: null, earliest_iso: null, snapshot_count: 0 };
  }

  const earliest = data[1][0]; // timestamp is first field

  // Get total snapshot count with a matchType=exact query (no limit)
  const countUrl = `${base}?url=${encodeURIComponent(domain)}&output=json&filter=statuscode:200&matchType=exact&fl=timestamp&limit=-1`;
  let snapshotCount = 1;
  try {
    const countResp = await fetch(countUrl, {
      headers: { "User-Agent": "SiteAge.org/1.0 (https://siteage.org)" },
      signal: AbortSignal.timeout(30000),
    });
    if (countResp.ok) {
      const countData = await countResp.json() as string[][];
      // First row is header, remaining rows are snapshots
      snapshotCount = Math.max(1, (countData?.length ?? 1) - 1);
    }
  } catch {
    // Non-critical, keep default count
  }

  return {
    earliest_timestamp: earliest,
    earliest_iso: cdxTimestampToISO(earliest),
    snapshot_count: snapshotCount,
  };
}
