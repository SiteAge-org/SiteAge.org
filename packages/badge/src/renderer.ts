import { BADGE_COLORS, birthYear } from "@siteage/shared";
import type { BadgeData, BadgeStyle } from "@siteage/shared";
import { measureText } from "./text-width.js";
import { renderFlat } from "./templates/flat.js";
import { renderFlatSquare } from "./templates/flat-square.js";
import { renderForTheBadge } from "./templates/for-the-badge.js";

export interface RenderOptions {
  data: BadgeData;
  style: BadgeStyle;
  overrideColor?: string;
  label: string;
  lang: string;
  logo: boolean;
}

function getBadgeColor(data: BadgeData): string {
  if (data.status === "dead") return BADGE_COLORS.dead;
  if (data.status === "unknown") return BADGE_COLORS.unknown;
  if (data.verification_status === "verified") return BADGE_COLORS.verified;
  return BADGE_COLORS.active;
}

function getBadgeMessage(data: BadgeData, lang: string): string {
  const birth = data.verified_birth_at || data.birth_at;

  if (data.status === "dead" && birth) {
    const birthYr = birthYear(birth);
    const deathYr = data.death_at ? birthYear(data.death_at) : "?";
    return lang === "zh" ? `R.I.P (${birthYr}-${deathYr})` : `R.I.P (${birthYr}-${deathYr})`;
  }

  if (!birth) {
    return lang === "zh" ? "Unknown" : "Unknown";
  }

  const year = birthYear(birth);
  if (data.verification_status === "verified") {
    return lang === "zh" ? `Est. ${year}` : `Established ${year}`;
  }

  return lang === "zh" ? `Since ${year}` : `Since ${year}`;
}

export function renderBadge(options: RenderOptions): string {
  const color = options.overrideColor || getBadgeColor(options.data);
  const message = getBadgeMessage(options.data, options.lang);
  const label = options.label;

  const labelWidth = measureText(label, 11) + 10;
  const messageWidth = measureText(message, 11) + 10;

  const params = { label, message, labelWidth, messageWidth, color, logo: options.logo };

  switch (options.style) {
    case "flat-square":
      return renderFlatSquare(params);
    case "for-the-badge":
      return renderForTheBadge({ ...params, labelWidth: measureText(label.toUpperCase(), 10) + 18, messageWidth: measureText(message.toUpperCase(), 10) + 18 });
    default:
      return renderFlat(params);
  }
}
