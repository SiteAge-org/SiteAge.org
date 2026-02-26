import { birthYear, formatAge } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Layout constants ────────────────────────────────────────────────
// Card sits centered within the 1200×630 canvas with generous margins
const CARD_X = 160;
const CARD_Y = 36;
const CARD_W = 880;
const CARD_H = 558;
const CARD_R = CARD_X + CARD_W; // 1040
const CARD_B = CARD_Y + CARD_H; // 594
const CX = 600; // horizontal center

/** Double-layer corner ornaments positioned on the card edges */
function cornerOrnaments(): string {
  const inset = 16; // inner ornament offset from outer
  const len = 56;   // outer arm length
  const lenI = 18;  // inner arm length
  return `
  <!-- Outer corner ornaments -->
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X} ${CARD_Y + len}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X + len} ${CARD_Y}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R} ${CARD_Y + len}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R - len} ${CARD_Y}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X} ${CARD_B - len}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X + len} ${CARD_B}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R} ${CARD_B - len}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R - len} ${CARD_B}" stroke="#c8a44e" stroke-width="2" fill="none" opacity="0.3"/>
  <!-- Inner corner ornaments -->
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset} ${CARD_Y + inset + lenI}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset + lenI} ${CARD_Y + inset}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset} ${CARD_Y + inset + lenI}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset - lenI} ${CARD_Y + inset}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset} ${CARD_B - inset - lenI}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset + lenI} ${CARD_B - inset}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset} ${CARD_B - inset - lenI}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset - lenI} ${CARD_B - inset}" stroke="#c8a44e" stroke-width="0.8" fill="none" opacity="0.15"/>`;
}

/** Ornamental divider with diamond */
function ornamentDivider(y: number, halfWidth: number = 100): string {
  return `
  <line x1="${CX - halfWidth - 20}" y1="${y}" x2="${CX - 8}" y2="${y}" stroke="#c8a44e" stroke-width="0.7" opacity="0.45"/>
  <text x="${CX}" y="${y + 4}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" fill="#c8a44e" opacity="0.5">&#x25C6;</text>
  <line x1="${CX + 8}" y1="${y}" x2="${CX + halfWidth + 20}" y2="${y}" stroke="#c8a44e" stroke-width="0.7" opacity="0.45"/>`;
}

/** Simple horizontal divider */
function simpleDivider(y: number, halfWidth: number = 80): string {
  return `<line x1="${CX - halfWidth}" y1="${y}" x2="${CX + halfWidth}" y2="${y}" stroke="#e8e0d0" stroke-width="0.7"/>`;
}

/** Verified owner badge — bordered pill with shield icon */
function verifiedBadge(y: number): string {
  const bw = 200; // badge width
  const bx = CX - bw / 2;
  const sx = CX - 40; // shield x
  const sy = y + 3;
  return `
  <rect x="${bx}" y="${y}" width="${bw}" height="30" rx="2" fill="none" stroke="#c8a44e" stroke-width="0.7" opacity="0.3"/>
  <rect x="${bx}" y="${y}" width="${bw}" height="30" rx="2" fill="#c8a44e" opacity="0.05"/>
  <!-- Shield icon -->
  <path d="M${sx} ${sy + 2} l5-2.2a1.8 1.8 0 011.8 0l5 2.2v8.2a6.3 6.3 0 01-2.9 5.3l-2 1.4a1.8 1.8 0 01-1.8 0l-2-1.4a6.3 6.3 0 01-2.9-5.3z" fill="#a8872e" opacity="0.8"/>
  <polyline points="${sx + 3.5} ${sy + 9.5} ${sx + 5.2} ${sy + 11.5} ${sx + 8.5} ${sy + 7}" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${CX + 14}" y="${y + 20}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="600" fill="#a8872e" letter-spacing="2">VERIFIED OWNER</text>`;
}

export function renderCertificateSvg(data: BadgeData): string {
  const birth = data.verified_birth_at || data.birth_at;
  const isVerified = data.verification_status === "verified";
  const domain = escapeXml(data.domain);

  if (!birth) {
    return renderUnknownSvg(domain);
  }

  const year = birthYear(birth);
  const d = new Date(birth);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fullDate = `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  const ageText = formatAge(birth);

  // Layout: shift content down when verified badge is shown
  const v = isVerified ? 24 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c8a44e" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#c8a44e" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#f5f2ed"/>

  <!-- Card background -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="#faf8f4"/>

  ${cornerOrnaments()}

  <!-- Inner decorative border -->
  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="#e8e0d0" stroke-width="0.5" opacity="0.5"/>

  <!-- Title -->
  <text x="${CX}" y="110" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="600" fill="#a8872e" letter-spacing="4.5">CERTIFICATE OF WEBSITE LONGEVITY</text>

  ${ornamentDivider(130)}

  <!-- Domain name -->
  <text x="${CX}" y="${195 + (isVerified ? 0 : 8)}" text-anchor="middle" font-family="'DM Serif Display'" font-size="46" fill="#1a1d2e">${domain}</text>

  <!-- Verified badge -->
  ${isVerified ? verifiedBadge(224) : ""}

  <!-- Label -->
  <text x="${CX}" y="${278 + v}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" fill="#6b7094" letter-spacing="3">${isVerified ? "ESTABLISHED" : "ONLINE SINCE"}</text>

  <!-- Year glow -->
  <ellipse cx="${CX}" cy="${345 + v}" rx="110" ry="50" fill="url(#glow)"/>

  <!-- Year -->
  <text x="${CX}" y="${360 + v}" text-anchor="middle" font-family="'DM Serif Display'" font-size="72" fill="#1a1d2e">${year}</text>

  <!-- Full date -->
  <text x="${CX}" y="${390 + v}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="13" fill="#6b7094" font-weight="300">${fullDate}</text>

  <!-- Divider -->
  ${simpleDivider(416 + v)}

  <!-- Age -->
  <text x="${CX}" y="${442 + v}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="14" fill="#1a1d2e">
    <tspan fill="#6b7094">Age: </tspan><tspan font-weight="600">${ageText}</tspan>
  </text>

  <!-- Footer -->
  ${simpleDivider(540, 150)}
  <text x="${CX}" y="566" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="#6b7094" opacity="0.45" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}

function renderUnknownSvg(domain: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#f5f2ed"/>
  <!-- Card -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="#faf8f4"/>

  ${cornerOrnaments()}

  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="#e8e0d0" stroke-width="0.5" opacity="0.5"/>

  <text x="${CX}" y="175" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="600" fill="#a8872e" letter-spacing="4.5">WEBSITE AGE CERTIFICATE</text>

  ${ornamentDivider(198)}

  <text x="${CX}" y="285" text-anchor="middle" font-family="'DM Serif Display'" font-size="46" fill="#1a1d2e">${domain}</text>

  <text x="${CX}" y="360" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="16" fill="#6b7094" font-weight="300">Age pending...</text>

  ${simpleDivider(500, 150)}
  <text x="${CX}" y="526" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="#6b7094" opacity="0.45" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
