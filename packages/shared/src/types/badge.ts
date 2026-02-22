export type BadgeStyle = "flat" | "flat-square" | "for-the-badge";
export type BadgeColor = "blue" | "gold" | "gray" | "orange";
export type BadgeLang = "en" | "zh";

export interface BadgeParams {
  domain: string;
  style: BadgeStyle;
  color?: BadgeColor;
  label?: string;
  lang?: BadgeLang;
  logo?: boolean;
}

export interface BadgeData {
  domain: string;
  birth_at: string | null;
  death_at: string | null;
  status: "active" | "unreachable" | "dead" | "unknown";
  verification_status: "detected" | "pending" | "verified";
  verified_birth_at: string | null;
}
