export type DomainStatus = "active" | "unreachable" | "dead" | "unknown";
export type VerificationStatus = "detected" | "pending" | "verified";
export type VerificationMethod = "dns_txt" | "meta_tag";
export type EvidenceType = "whois" | "git_history" | "dns_record" | "other";
export type EvidenceStatus = "pending" | "approved" | "rejected";
export type CheckType = "priority" | "random" | "manual";

export interface Domain {
  id: number;
  domain: string;
  birth_at: string | null;
  death_at: string | null;
  status: DomainStatus;
  verification_status: VerificationStatus;
  verified_birth_at: string | null;
  consecutive_failures: number;
  badge_embedded: boolean;
  last_checked_at: string | null;
  last_alive_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: number;
  domain_id: number;
  email: string;
  method: VerificationMethod;
  token: string;
  magic_key: string | null;
  status: string;
  last_attempt_at: string | null;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface Evidence {
  id: number;
  domain_id: number;
  type: EvidenceType;
  claimed_at: string;
  description: string | null;
  url: string | null;
  status: EvidenceStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface HealthCheck {
  id: number;
  domain_id: number;
  status_code: number | null;
  response_time_ms: number | null;
  check_type: CheckType;
  badge_detected: boolean;
  created_at: string;
}

export interface CdxQuery {
  id: number;
  domain: string;
  earliest_timestamp: string | null;
  snapshot_count: number;
  created_at: string;
}

export interface StatsSnapshot {
  id: number;
  total_domains: number;
  percentile_data: string;
  created_at: string;
}
