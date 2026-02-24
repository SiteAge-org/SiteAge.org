export type BadgeStyle = "flat" | "flat-square" | "for-the-badge";
export type BadgeColor = "blue" | "gold" | "gray" | "orange";
export type BadgeMessageType = "since" | "established";
export type BadgeTimeFormat = "year" | "month" | "date" | "age" | "days";

export interface BadgeParams {
  domain: string;
  style: BadgeStyle;
  color?: BadgeColor;
  label?: string;
  type?: BadgeMessageType;
  format?: BadgeTimeFormat;
}

export interface BadgeData {
  domain: string;
  birth_at: string | null;
  death_at: string | null;
  status: "active" | "unreachable" | "dead" | "unknown";
  verification_status: "detected" | "pending" | "verified";
  verified_birth_at: string | null;
}
