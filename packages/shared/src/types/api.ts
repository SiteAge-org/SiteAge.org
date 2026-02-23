export interface LookupRequest {
  url: string;
  force?: boolean;
}

export interface LookupResponse {
  domain: string;
  birth_at: string | null;
  age_days: number | null;
  status: string;
  verification_status: string;
  badge_url: string;
  detail_url: string;
}

export interface DomainDetail {
  domain: string;
  birth_at: string | null;
  death_at: string | null;
  verified_birth_at: string | null;
  status: string;
  verification_status: string;
  age_days: number | null;
  rank_percentile: number | null;
  first_snapshot_url: string | null;
  badge_url: string;
  badge_embedded: boolean;
  created_at: string;
}

export interface VerifyInitRequest {
  domain: string;
  email: string;
  method: "dns_txt" | "meta_tag";
}

export interface VerifyInitResponse {
  token: string;
  method: "dns_txt" | "meta_tag";
  instructions: string;
}

export interface VerifyCheckRequest {
  domain: string;
  token: string;
}

export interface VerifyCheckResponse {
  verified: boolean;
  message: string;
}

export interface VerifyResendRequest {
  domain: string;
  email: string;
}

export interface EvidenceSubmitRequest {
  domain: string;
  key: string;
  type: "whois" | "git_history" | "dns_record" | "other";
  claimed_at: string;
  description?: string;
  url?: string;
}

export interface ManageData {
  domain: string;
  birth_at: string | null;
  verified_birth_at: string | null;
  status: string;
  verification_status: string;
  email: string;
  evidence: Array<{
    id: number;
    type: string;
    claimed_at: string;
    status: string;
    created_at: string;
  }>;
}

export interface GlobalStats {
  total_domains: number;
  active_domains: number;
  dead_domains: number;
  verified_domains: number;
  oldest_domain: string | null;
  oldest_birth_at: string | null;
}

export interface AdminDashboard {
  stats: GlobalStats;
  pending_evidence_count: number;
}

export interface ApiError {
  error: string;
  message: string;
}
