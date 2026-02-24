import { BADGE_COLORS, birthYear, formatBirthTime } from "@siteage/shared";
import type { BadgeData, BadgeStyle, BadgeMessageType, BadgeTimeFormat } from "@siteage/shared";
import { measureText } from "./text-width.js";
import { renderFlat } from "./templates/flat.js";
import { renderFlatSquare } from "./templates/flat-square.js";
import { renderForTheBadge } from "./templates/for-the-badge.js";

export interface RenderOptions {
  data: BadgeData;
  style: BadgeStyle;
  overrideColor?: string;
  label: string;
  type?: BadgeMessageType;
  format?: BadgeTimeFormat;
}

/**
 * Resolve type/format with permission downgrade for unverified sites.
 */
function resolveParams(
  type: BadgeMessageType | undefined,
  format: BadgeTimeFormat | undefined,
  isVerified: boolean,
): { type: BadgeMessageType; format: BadgeTimeFormat } {
  let resolvedType = type ?? (isVerified ? "established" : "since");
  let resolvedFormat = format ?? "year";

  if (!isVerified) {
    if (resolvedType === "established") resolvedType = "since";
    if (resolvedFormat !== "year") resolvedFormat = "year";
  }

  return { type: resolvedType, format: resolvedFormat };
}

function getBadgeColor(data: BadgeData): string {
  if (data.status === "dead") return BADGE_COLORS.dead;
  if (data.status === "unknown") return BADGE_COLORS.unknown;
  if (data.verification_status === "verified") return BADGE_COLORS.verified;
  return BADGE_COLORS.active;
}

function getBadgeMessage(
  data: BadgeData,
  type?: BadgeMessageType,
  format?: BadgeTimeFormat,
): string {
  const birth = data.verified_birth_at || data.birth_at;
  const isVerified = data.verification_status === "verified";

  // Dead sites always show R.I.P
  if (data.status === "dead" && birth) {
    const birthYr = birthYear(birth);
    const deathYr = data.death_at ? birthYear(data.death_at) : "?";
    return `R.I.P (${birthYr}-${deathYr})`;
  }

  if (!birth) {
    return "Unknown";
  }

  const resolved = resolveParams(type, format, isVerified);
  const timeStr = formatBirthTime(birth, resolved.format);

  // Relative formats use different templates
  if (resolved.format === "age" || resolved.format === "days") {
    if (resolved.type === "established") {
      return `Est. ${timeStr}`;
    }
    return `${timeStr} Online`;
  }

  // Absolute formats
  if (resolved.type === "established") {
    return `Established ${timeStr}`;
  }
  return `Since ${timeStr}`;
}

export function renderBadge(options: RenderOptions): string {
  const color = options.overrideColor || getBadgeColor(options.data);
  const message = getBadgeMessage(options.data, options.type, options.format);
  const label = options.label;

  const labelWidth = measureText(label, 11) + 10;
  const messageWidth = measureText(message, 11) + 10;

  const params = { label, message, labelWidth, messageWidth, color };

  switch (options.style) {
    case "flat-square":
      return renderFlatSquare(params);
    case "for-the-badge":
      return renderForTheBadge({ ...params, labelWidth: measureText(label.toUpperCase(), 10) + 18, messageWidth: measureText(message.toUpperCase(), 10) + 18 });
    default:
      return renderFlat(params);
  }
}
