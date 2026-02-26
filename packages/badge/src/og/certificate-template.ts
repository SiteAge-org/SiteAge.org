import { birthYear, formatAge } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Design tokens (matching web CSS variables) ──────────────────────
const SEAL = "#c8a44e";
const SEAL_DARK = "#a8872e";
const INK = "#1a1d2e";
const INK_MUTED = "#6b7094";
const PARCHMENT = "#faf8f4";
const DIVIDER = "#e2ddd3";

// ── Card layout ─────────────────────────────────────────────────────
const CARD_X = 160;
const CARD_Y = 36;
const CARD_W = 880;
const CARD_H = 558;
const CARD_R = CARD_X + CARD_W;
const CARD_B = CARD_Y + CARD_H;
const CX = 600; // horizontal center

// ── Shared SVG defs ─────────────────────────────────────────────────
function sharedDefs(): string {
  return `<defs>
    <!-- Card background gradient: white → parchment (matches from-white to-parchment/80) -->
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${PARCHMENT}" stop-opacity="0.85"/>
    </linearGradient>
    <!-- Gold glow behind year number (matches bg-seal/[0.06] blur-xl scale-150) -->
    <radialGradient id="yearGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${SEAL}" stop-opacity="0.08"/>
      <stop offset="70%" stop-color="${SEAL}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${SEAL}" stop-opacity="0"/>
    </radialGradient>
    <!-- Ornament line gradient (matches .ornament-line CSS) -->
    <linearGradient id="ornLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${DIVIDER}" stop-opacity="0"/>
      <stop offset="15%" stop-color="${DIVIDER}"/>
      <stop offset="40%" stop-color="${SEAL}"/>
      <stop offset="60%" stop-color="${SEAL}"/>
      <stop offset="85%" stop-color="${DIVIDER}"/>
      <stop offset="100%" stop-color="${DIVIDER}" stop-opacity="0"/>
    </linearGradient>
    <!-- Card shadow -->
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${INK}" flood-opacity="0.05"/>
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="${INK}" flood-opacity="0.06"/>
      <feDropShadow dx="0" dy="12" stdDeviation="28" flood-color="${SEAL}" flood-opacity="0.03"/>
    </filter>
  </defs>`;
}

/** Double-layer corner ornaments — matches page's border-seal/30 + border-seal/15 */
function cornerOrnaments(color: string = SEAL, outerOpacity: number = 0.3, innerOpacity: number = 0.15): string {
  const len = 48;  // outer arm length (matches w-12 = 48px)
  const inset = 16;
  const lenI = 16; // inner arm length (matches w-4 = 16px)
  return `
  <!-- Outer corners (border-2 border-seal/30) -->
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X} ${CARD_Y + len}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_X} ${CARD_Y} L${CARD_X + len} ${CARD_Y}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R} ${CARD_Y + len}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_R} ${CARD_Y} L${CARD_R - len} ${CARD_Y}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X} ${CARD_B - len}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_X} ${CARD_B} L${CARD_X + len} ${CARD_B}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R} ${CARD_B - len}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <path d="M${CARD_R} ${CARD_B} L${CARD_R - len} ${CARD_B}" stroke="${color}" stroke-width="2" fill="none" opacity="${outerOpacity}"/>
  <!-- Inner corners (border border-seal/15) -->
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset} ${CARD_Y + inset + lenI}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_X + inset} ${CARD_Y + inset} L${CARD_X + inset + lenI} ${CARD_Y + inset}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset} ${CARD_Y + inset + lenI}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_R - inset} ${CARD_Y + inset} L${CARD_R - inset - lenI} ${CARD_Y + inset}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset} ${CARD_B - inset - lenI}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_X + inset} ${CARD_B - inset} L${CARD_X + inset + lenI} ${CARD_B - inset}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset} ${CARD_B - inset - lenI}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>
  <path d="M${CARD_R - inset} ${CARD_B - inset} L${CARD_R - inset - lenI} ${CARD_B - inset}" stroke="${color}" stroke-width="1" fill="none" opacity="${innerOpacity}"/>`;
}

/** Gradient ornament line (matches .ornament-line CSS) */
function ornamentLine(y: number, halfWidth: number = 96): string {
  return `<rect x="${CX - halfWidth}" y="${y}" width="${halfWidth * 2}" height="1" fill="url(#ornLine)"/>`;
}

/** Verified owner badge — gradient bg matching page design */
function verifiedBadge(y: number): string {
  const bw = 190;
  const bx = CX - bw / 2;
  const sx = CX - 38;
  const sy = y + 3;
  return `
  <!-- Verified badge (bg-gradient from-seal-light/20 to-seal/10 + border-seal/30) -->
  <rect x="${bx}" y="${y}" width="${bw}" height="28" rx="2" fill="${SEAL}" opacity="0.06"/>
  <rect x="${bx}" y="${y}" width="${bw}" height="28" rx="2" fill="none" stroke="${SEAL}" stroke-width="0.7" opacity="0.3"/>
  <!-- Shield icon -->
  <path d="M${sx} ${sy + 2} l4.8-2.1a1.6 1.6 0 011.6 0l4.8 2.1v7.8a6 6 0 01-2.7 5l-1.9 1.3a1.6 1.6 0 01-1.6 0l-1.9-1.3a6 6 0 01-2.7-5z" fill="${SEAL_DARK}" opacity="0.8"/>
  <polyline points="${sx + 3.2} ${sy + 9} ${sx + 4.8} ${sy + 11} ${sx + 8} ${sy + 6.5}" fill="none" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="${CX + 12}" y="${y + 19}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="600" fill="${SEAL_DARK}" letter-spacing="1.5">VERIFIED OWNER</text>`;
}

export function renderCertificateSvg(data: BadgeData): string {
  const birth = data.verified_birth_at || data.birth_at;
  const isVerified = data.verification_status === "verified";
  const domain = escapeXml(data.domain);

  if (!birth) {
    return renderUnknownSvg(domain);
  }

  const year = birthYear(birth);
  // Match CertificateCard.astro date formatting exactly (no timeZone = server local)
  const fullDate = new Date(birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const ageText = formatAge(birth);

  const v = isVerified ? 20 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${sharedDefs()}

  <!-- Canvas background -->
  <rect width="1200" height="630" fill="#f0ece4"/>

  <!-- Card with shadow -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="white" filter="url(#cardShadow)"/>
  <!-- Card gradient bg -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="url(#cardBg)"/>
  <!-- Card border -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="none" stroke="${DIVIDER}" stroke-width="1"/>

  ${cornerOrnaments()}

  <!-- Inner decorative border (matches inset-6 = 24px) -->
  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="${DIVIDER}" stroke-width="0.5" opacity="0.5"/>


  <!-- Title (text-[10px] tracking-[0.4em] uppercase) -->
  <text x="${CX}" y="108" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="500" fill="${SEAL_DARK}" letter-spacing="4">CERTIFICATE OF WEBSITE LONGEVITY</text>

  <!-- Ornament line -->
  ${ornamentLine(122)}

  <!-- Domain name (font-display text-3xl sm:text-4xl) -->
  <text x="${CX}" y="${192 + (isVerified ? 0 : 8)}" text-anchor="middle" font-family="'DM Serif Display'" font-size="46" fill="${INK}">${domain}</text>

  <!-- Verified badge -->
  ${isVerified ? verifiedBadge(218) : ""}

  <!-- Label (text-xs tracking-[0.2em] uppercase ink-muted) -->
  <text x="${CX}" y="${268 + v}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="11" fill="${INK_MUTED}" letter-spacing="2.5">${isVerified ? "ESTABLISHED" : "ONLINE SINCE"}</text>

  <!-- Year glow (bg-seal/[0.06] blur-xl rounded-full scale-150) -->
  <ellipse cx="${CX}" cy="${336 + v}" rx="130" ry="56" fill="url(#yearGlow)"/>

  <!-- Year (font-display text-6xl sm:text-7xl — 96px) -->
  <text x="${CX}" y="${356 + v}" text-anchor="middle" font-family="'DM Serif Display'" font-size="96" fill="${INK}">${year}</text>

  <!-- Full date (text-sm ink-muted font-light) -->
  <text x="${CX}" y="${390 + v}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="13" fill="${INK_MUTED}" font-weight="300">${fullDate}</text>

  <!-- Ornament divider -->
  ${ornamentLine(414 + v, 64)}

  <!-- Age (text-ink-muted + font-medium text-ink) -->
  <text x="${CX}" y="${440 + v}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="14" fill="${INK_MUTED}">
    Age: <tspan font-weight="500" fill="${INK}">${ageText}</tspan>
  </text>

  <!-- Footer -->
  ${ornamentLine(530)}
  <text x="${CX}" y="552" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="${INK_MUTED}" opacity="0.5" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}

function renderUnknownSvg(domain: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${sharedDefs()}

  <rect width="1200" height="630" fill="#f0ece4"/>

  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="white" filter="url(#cardShadow)"/>
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="url(#cardBg)"/>
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="none" stroke="${DIVIDER}" stroke-width="1"/>

  ${cornerOrnaments()}

  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="${DIVIDER}" stroke-width="0.5" opacity="0.5"/>

  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" fill="white" opacity="0.04" filter="url(#noise)"/>

  <text x="${CX}" y="175" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="500" fill="${SEAL_DARK}" letter-spacing="4">WEBSITE AGE CERTIFICATE</text>

  ${ornamentLine(192)}

  <text x="${CX}" y="280" text-anchor="middle" font-family="'DM Serif Display'" font-size="46" fill="${INK}">${domain}</text>

  <text x="${CX}" y="355" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="16" fill="${INK_MUTED}" font-weight="300">Age pending...</text>

  ${ornamentLine(500)}
  <text x="${CX}" y="526" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="${INK_MUTED}" opacity="0.5" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
