import { birthYear, formatAge } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Design tokens ───────────────────────────────────────────────────
const TOMBSTONE = "#9f9f9f";
const INK_MUTED = "#6b6b6b";
const DIVIDER = "#c8c2b8";

// ── Card layout (same dimensions as certificate) ────────────────────
const CARD_X = 160;
const CARD_Y = 36;
const CARD_W = 880;
const CARD_H = 558;
const CARD_R = CARD_X + CARD_W;
const CARD_B = CARD_Y + CARD_H;
const CX = 600;

export function renderTombstoneSvg(data: BadgeData): string {
  const birth = data.verified_birth_at || data.birth_at;
  const domain = escapeXml(data.domain);
  const deathYear = data.death_at ? birthYear(data.death_at) : "?";

  const yearRange = birth
    ? `${birthYear(birth)} &#x2014; ${deathYear}`
    : "";

  const survivalText = birth
    ? `Survived for ${escapeXml(formatAge(birth, data.death_at || undefined))}`
    : "";

  const len = 48;
  const inset = 16;
  const lenI = 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#efecea"/>
      <stop offset="100%" stop-color="#eae6df"/>
    </linearGradient>
    <linearGradient id="ornLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${DIVIDER}" stop-opacity="0"/>
      <stop offset="15%" stop-color="${DIVIDER}"/>
      <stop offset="40%" stop-color="${TOMBSTONE}"/>
      <stop offset="60%" stop-color="${TOMBSTONE}"/>
      <stop offset="85%" stop-color="${DIVIDER}"/>
      <stop offset="100%" stop-color="${DIVIDER}" stop-opacity="0"/>
    </linearGradient>
    <filter id="cardShadow" x="-3%" y="-3%" width="106%" height="110%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#1a1d2e" flood-opacity="0.05"/>
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#1a1d2e" flood-opacity="0.04"/>
    </filter>
  </defs>

  <!-- Canvas -->
  <rect width="1200" height="630" fill="#e0dcd5"/>

  <!-- Card -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="#eae6df" filter="url(#cardShadow)"/>
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="url(#cardBg)"/>
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="none" stroke="${DIVIDER}" stroke-width="1"/>

  <!-- Outer corners -->
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X} ${CARD_Y + len}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X + len} ${CARD_Y}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R} ${CARD_Y + len}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R - len} ${CARD_Y}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X} ${CARD_B - len}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X + len} ${CARD_B}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R} ${CARD_B - len}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R - len} ${CARD_B}" stroke="${TOMBSTONE}" stroke-width="2" fill="none" opacity="0.25"/>
  <!-- Corner diamond accents -->
  ${[[CARD_X, CARD_Y], [CARD_R, CARD_Y], [CARD_X, CARD_B], [CARD_R, CARD_B]].map(([x, y]) => `<path d="M${x} ${y - 2.5} L${x + 2.5} ${y} L${x} ${y + 2.5} L${x - 2.5} ${y} Z" fill="${TOMBSTONE}" opacity="0.15"/>`).join('\n  ')}
  <!-- Inner corners -->
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset} ${CARD_Y + inset + lenI}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset + lenI} ${CARD_Y + inset}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset} ${CARD_Y + inset + lenI}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset - lenI} ${CARD_Y + inset}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset} ${CARD_B - inset - lenI}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset + lenI} ${CARD_B - inset}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset} ${CARD_B - inset - lenI}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset - lenI} ${CARD_B - inset}" stroke="${TOMBSTONE}" stroke-width="1" fill="none" opacity="0.12"/>

  <!-- Inner border -->
  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="${DIVIDER}" stroke-width="0.5" opacity="0.4"/>

  <!-- In Memoriam -->
  <text x="${CX}" y="138" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="500" fill="${TOMBSTONE}" letter-spacing="4.5">IN MEMORIAM</text>

  <!-- Ornament line with diamond -->
  <rect x="${CX - 80}" y="155" width="${80 - 5}" height="1" fill="url(#ornLine)"/>
  <rect x="${CX + 5}" y="155" width="${80 - 5}" height="1" fill="url(#ornLine)"/>
  <path d="M${CX} ${155 - 3} L${CX + 3} 155.5 L${CX} ${155 + 4} L${CX - 3} 155.5 Z" fill="${TOMBSTONE}" opacity="0.2"/>

  <!-- Domain -->
  <text x="${CX}" y="232" text-anchor="middle" font-family="'DM Serif Display'" font-size="42" fill="${INK_MUTED}">${domain}</text>

  <!-- R.I.P -->
  <text x="${CX}" y="316" text-anchor="middle" font-family="'DM Serif Display'" font-size="56" fill="${TOMBSTONE}" opacity="0.5">R.I.P</text>

  <!-- Year range -->
  ${yearRange ? `<text x="${CX}" y="362" text-anchor="middle" font-family="'DM Serif Display'" font-size="24" fill="${TOMBSTONE}" opacity="0.5">${yearRange}</text>` : ""}

  <!-- Survival text -->
  ${survivalText ? `<text x="${CX}" y="398" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="13" fill="${TOMBSTONE}" opacity="0.4" font-weight="300">${survivalText}</text>` : ""}

  <!-- Footer -->
  <rect x="${CX - 120}" y="500" width="240" height="1" fill="url(#ornLine)"/>
  <text x="${CX}" y="524" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="${TOMBSTONE}" opacity="0.4" letter-spacing="1.5">REMEMBERED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
