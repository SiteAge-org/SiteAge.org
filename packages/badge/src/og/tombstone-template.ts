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

  <!-- Outer corner ornaments -->
  <path d="M36 36 L36 100" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M36 36 L100 36" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M1164 36 L1164 100" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M1164 36 L1100 36" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M36 594 L36 530" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M36 594 L100 594" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M1164 594 L1164 530" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <path d="M1164 594 L1100 594" stroke="#9f9f9f" stroke-width="2.5" fill="none" opacity="0.3"/>
  <!-- Inner corner ornaments -->
  <path d="M52 52 L52 72" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M52 52 L72 52" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M1148 52 L1148 72" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M1148 52 L1128 52" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M52 578 L52 558" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M52 578 L72 578" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M1148 578 L1148 558" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>
  <path d="M1148 578 L1128 578" stroke="#9f9f9f" stroke-width="1" fill="none" opacity="0.15"/>

  <!-- Inner border -->
  <rect x="70" y="70" width="1060" height="490" fill="none" stroke="#c8c2b8" stroke-width="0.5" opacity="0.5"/>

  <!-- In Memoriam -->
  <text x="600" y="150" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="11" font-weight="600" fill="#9f9f9f" letter-spacing="5">IN MEMORIAM</text>

  <!-- Divider -->
  <line x1="490" y1="172" x2="590" y2="172" stroke="#9f9f9f" stroke-width="0.6" opacity="0.4"/>
  <text x="600" y="177" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" fill="#9f9f9f" opacity="0.4">&#x2020;</text>
  <line x1="610" y1="172" x2="710" y2="172" stroke="#9f9f9f" stroke-width="0.6" opacity="0.4"/>

  <!-- Domain name -->
  <text x="600" y="250" text-anchor="middle" font-family="'DM Serif Display'" font-size="44" fill="#6b6b6b">${domain}</text>

  <!-- R.I.P -->
  <text x="600" y="330" text-anchor="middle" font-family="'DM Serif Display'" font-size="60" fill="#9f9f9f" opacity="0.6">R.I.P</text>

  <!-- Year range -->
  ${yearRange ? `<text x="600" y="380" text-anchor="middle" font-family="'DM Serif Display'" font-size="26" fill="#9f9f9f" opacity="0.55">${yearRange}</text>` : ""}

  <!-- Survival text -->
  ${survivalText ? `<text x="600" y="420" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="14" fill="#9f9f9f" opacity="0.45" font-weight="300">${survivalText}</text>` : ""}

  <!-- Footer divider -->
  <line x1="400" y1="500" x2="800" y2="500" stroke="#c8c2b8" stroke-width="0.6"/>

  <!-- Brand footer -->
  <text x="600" y="530" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" fill="#9f9f9f" opacity="0.4" letter-spacing="1.5">REMEMBERED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
