import { birthYear, formatAge } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Layout constants (shared with certificate) ─────────────────────
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
    ? `Survived for ${formatAge(birth, data.death_at || undefined)}`
    : "";

  const inset = 16;
  const len = 56;
  const lenI = 18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#e4e1db"/>
  <!-- Card -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="#eae6df"/>

  <!-- Outer corner ornaments -->
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X} ${CARD_Y + len}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X + len} ${CARD_Y}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R} ${CARD_Y + len}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R - len} ${CARD_Y}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X} ${CARD_B - len}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X + len} ${CARD_B}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R} ${CARD_B - len}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R - len} ${CARD_B}" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.25"/>
  <!-- Inner corner ornaments -->
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset} ${CARD_Y + inset + lenI}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset + lenI} ${CARD_Y + inset}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset} ${CARD_Y + inset + lenI}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset - lenI} ${CARD_Y + inset}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset} ${CARD_B - inset - lenI}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset + lenI} ${CARD_B - inset}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset} ${CARD_B - inset - lenI}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset - lenI} ${CARD_B - inset}" stroke="#9f9f9f" stroke-width="0.8" fill="none" opacity="0.12"/>

  <!-- Inner border -->
  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="#c8c2b8" stroke-width="0.5" opacity="0.4"/>

  <!-- In Memoriam -->
  <text x="${CX}" y="140" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="600" fill="#9f9f9f" letter-spacing="4.5">IN MEMORIAM</text>

  <!-- Cross divider -->
  <line x1="${CX - 90}" y1="160" x2="${CX - 8}" y2="160" stroke="#9f9f9f" stroke-width="0.6" opacity="0.35"/>
  <text x="${CX}" y="164" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="#9f9f9f" opacity="0.35">&#x2020;</text>
  <line x1="${CX + 8}" y1="160" x2="${CX + 90}" y2="160" stroke="#9f9f9f" stroke-width="0.6" opacity="0.35"/>

  <!-- Domain name -->
  <text x="${CX}" y="235" text-anchor="middle" font-family="'DM Serif Display'" font-size="42" fill="#6b6b6b">${domain}</text>

  <!-- R.I.P -->
  <text x="${CX}" y="315" text-anchor="middle" font-family="'DM Serif Display'" font-size="56" fill="#9f9f9f" opacity="0.5">R.I.P</text>

  <!-- Year range -->
  ${yearRange ? `<text x="${CX}" y="362" text-anchor="middle" font-family="'DM Serif Display'" font-size="24" fill="#9f9f9f" opacity="0.5">${yearRange}</text>` : ""}

  <!-- Survival text -->
  ${survivalText ? `<text x="${CX}" y="398" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="13" fill="#9f9f9f" opacity="0.4" font-weight="300">${survivalText}</text>` : ""}

  <!-- Footer -->
  <line x1="${CX - 150}" y1="500" x2="${CX + 150}" y2="500" stroke="#c8c2b8" stroke-width="0.5"/>
  <text x="${CX}" y="526" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="#9f9f9f" opacity="0.35" letter-spacing="1.5">REMEMBERED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
