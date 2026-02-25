import { birthYear, formatAge } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background — muted parchment -->
  <rect width="1200" height="630" fill="#eae6df"/>

  <!-- Corner ornaments (muted gray) -->
  <path d="M40 40 L40 95" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M40 40 L95 40" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M1160 40 L1160 95" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M1160 40 L1105 40" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M40 590 L40 535" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M40 590 L95 590" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M1160 590 L1160 535" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>
  <path d="M1160 590 L1105 590" stroke="#9f9f9f" stroke-width="2" fill="none" opacity="0.4"/>

  <!-- Inner border -->
  <rect x="60" y="60" width="1080" height="510" fill="none" stroke="#c8c2b8" stroke-width="0.5"/>

  <!-- In Memoriam -->
  <text x="600" y="150" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" fill="#9f9f9f" letter-spacing="5">IN MEMORIAM</text>

  <!-- Divider -->
  <line x1="480" y1="172" x2="720" y2="172" stroke="#9f9f9f" stroke-width="0.6" opacity="0.5"/>

  <!-- Domain name -->
  <text x="600" y="240" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="44" fill="#6b6b6b">${domain}</text>

  <!-- R.I.P -->
  <text x="600" y="330" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="64" fill="#9f9f9f" opacity="0.7">R.I.P</text>

  <!-- Year range -->
  ${yearRange ? `<text x="600" y="380" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="28" fill="#9f9f9f" opacity="0.6">${yearRange}</text>` : ""}

  <!-- Survival text -->
  ${survivalText ? `<text x="600" y="420" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#9f9f9f" opacity="0.5">${survivalText}</text>` : ""}

  <!-- Divider -->
  <line x1="470" y1="470" x2="730" y2="470" stroke="#c8c2b8" stroke-width="0.6"/>

  <!-- Brand footer -->
  <text x="600" y="530" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#9f9f9f" opacity="0.5">Remembered by siteage.org &#xB7; Data from Internet Archive</text>
</svg>`;
}
