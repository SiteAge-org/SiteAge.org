import type { SourceResult } from "./types.js";

/**
 * Resolve the best (earliest) birth date from multiple source results.
 * Returns the earliest date across all successful queries.
 */
export function resolveBestDate(results: SourceResult[]): string | null {
  let best: string | null = null;

  for (const result of results) {
    if (result.error || !result.earliest_date) continue;

    if (!best || result.earliest_date < best) {
      best = result.earliest_date;
    }
  }

  return best;
}

/**
 * Get summary of which sources contributed to the result.
 */
export function getSourcesSummary(results: SourceResult[]): {
  sources_queried: string[];
  sources_failed: string[];
} {
  const queried: string[] = [];
  const failed: string[] = [];

  for (const result of results) {
    queried.push(result.source);
    if (result.error) {
      failed.push(result.source);
    }
  }

  return { sources_queried: queried, sources_failed: failed };
}
