import { BADGE_COLORS, BADGE_VERIFIED_STYLES, birthYear, formatBirthTime } from "@siteage/shared";
import type { BadgeData, BadgeStyle, BadgeMessageType, BadgeTimeFormat } from "@siteage/shared";
import { measureText } from "./text-width.js";
import { renderFlat } from "./templates/flat.js";
import { renderFlatSquare } from "./templates/flat-square.js";
import { renderForTheBadge } from "./templates/for-the-badge.js";
import { renderPlastic } from "./templates/plastic.js";
import { renderSocial } from "./templates/social.js";
import { renderGold } from "./templates/gold.js";
import { renderVintage } from "./templates/vintage.js";
import { renderDark } from "./templates/dark.js";
import { renderSeal } from "./templates/seal.js";
import { renderMinimal } from "./templates/minimal.js";

export interface RenderOptions {
  data: BadgeData;
  style: BadgeStyle;
  overrideColor?: string;
  label: string;
  type?: BadgeMessageType;
  format?: BadgeTimeFormat;
}

/**
 * Resolve style/type/format with permission downgrade for unverified sites.
 */
function resolveParams(
  style: BadgeStyle,
  type: BadgeMessageType | undefined,
  format: BadgeTimeFormat | undefined,
  isVerified: boolean,
): { style: BadgeStyle; type: BadgeMessageType; format: BadgeTimeFormat } {
  let resolvedStyle = style;
  let resolvedType = type ?? (isVerified ? "established" : "since");
  let resolvedFormat = format ?? "year";

  if (!isVerified) {
    if ((BADGE_VERIFIED_STYLES as readonly string[]).includes(resolvedStyle)) resolvedStyle = "flat";
    if (resolvedType === "established") resolvedType = "since";
    if (resolvedFormat !== "year") resolvedFormat = "year";
  }

  return { style: resolvedStyle, type: resolvedType, format: resolvedFormat };
}

function getBadgeColor(data: BadgeData): string {
  if (data.status === "dead") return BADGE_COLORS.dead;
  if (data.status === "unknown") return BADGE_COLORS.unknown;
  if (data.verification_status === "verified") return BADGE_COLORS.verified;
  return BADGE_COLORS.active;
}

function getBadgeMessage(
  data: BadgeData,
  resolvedType: BadgeMessageType,
  resolvedFormat: BadgeTimeFormat,
): string {
  const birth = data.verified_birth_at || data.birth_at;

  // Dead sites always show R.I.P
  if (data.status === "dead" && birth) {
    const birthYr = birthYear(birth);
    const deathYr = data.death_at ? birthYear(data.death_at) : "?";
    return `R.I.P (${birthYr}-${deathYr})`;
  }

  if (!birth) {
    return "Unknown";
  }

  const timeStr = formatBirthTime(birth, resolvedFormat);

  // Relative formats use different templates
  if (resolvedFormat === "age" || resolvedFormat === "days") {
    if (resolvedType === "established") {
      return `Est. ${timeStr}`;
    }
    return `${timeStr} Online`;
  }

  // Absolute formats
  if (resolvedType === "established") {
    return `Established ${timeStr}`;
  }
  return `Since ${timeStr}`;
}

export function renderBadge(options: RenderOptions): string {
  const isVerified = options.data.verification_status === "verified";
  const resolved = resolveParams(options.style, options.type, options.format, isVerified);

  // gold/vintage use fixed color schemes, ignore overrideColor
  const ignoreColor = resolved.style === "gold" || resolved.style === "vintage";
  const color = (!ignoreColor && options.overrideColor) || getBadgeColor(options.data);
  const message = getBadgeMessage(options.data, resolved.type, resolved.format);
  const label = options.label;

  const labelWidth = measureText(label, 11) + 10;
  const messageWidth = measureText(message, 11) + 10;

  const params = { label, message, labelWidth, messageWidth, color };

  switch (resolved.style) {
    case "flat-square":
      return renderFlatSquare(params);
    case "for-the-badge":
      return renderForTheBadge({ ...params, labelWidth: measureText(label.toUpperCase(), 10) + 18, messageWidth: measureText(message.toUpperCase(), 10) + 18 });
    case "plastic":
      return renderPlastic(params);
    case "social":
      return renderSocial(params);
    case "gold":
      return renderGold(params);
    case "vintage":
      return renderVintage(params);
    case "dark":
      return renderDark(params);
    case "seal": {
      const sealLabel = `✦ ${label}`;
      const sealLabelWidth = measureText(sealLabel, 11) + 10;
      return renderSeal({ ...params, label: sealLabel, labelWidth: sealLabelWidth });
    }
    case "minimal":
      return renderMinimal(params);
    default:
      return renderFlat(params);
  }
}
