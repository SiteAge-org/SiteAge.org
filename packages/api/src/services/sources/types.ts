export interface SourceResult {
  source: string;
  earliest_date: string | null;
  raw_data: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  queried_at: string;
  error?: string;
}

export interface DataSource {
  readonly name: string;
  query(domain: string): Promise<SourceResult>;
}
