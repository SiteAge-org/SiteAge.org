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
    <!-- Card shadow (crisp, tight layers) -->
    <filter id="cardShadow" x="-3%" y="-3%" width="106%" height="110%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${INK}" flood-opacity="0.06"/>
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${INK}" flood-opacity="0.04"/>
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

/** Ornament line with center diamond accent — used for primary dividers */
function ornamentLineDiamond(y: number, halfWidth: number = 96): string {
  const d = 3;
  const gap = d + 2;
  return `
  <rect x="${CX - halfWidth}" y="${y}" width="${halfWidth - gap}" height="1" fill="url(#ornLine)"/>
  <rect x="${CX + gap}" y="${y}" width="${halfWidth - gap}" height="1" fill="url(#ornLine)"/>
  <path d="M${CX} ${y - d} L${CX + d} ${y + 0.5} L${CX} ${y + d + 1} L${CX - d} ${y + 0.5} Z" fill="${SEAL}" opacity="0.3"/>`;
}

/** Small diamond accents at outer corner intersection points */
function cornerAccents(): string {
  const d = 2.5;
  return [[CARD_X, CARD_Y], [CARD_R, CARD_Y], [CARD_X, CARD_B], [CARD_R, CARD_B]]
    .map(([x, y]) => `<path d="M${x} ${y - d} L${x + d} ${y} L${x} ${y + d} L${x - d} ${y} Z" fill="${SEAL}" opacity="0.2"/>`)
    .join('\n  ');
}

/** Verified owner badge — uses same heroicons badge-check icon as CertificateCard.astro */
function verifiedBadge(y: number): string {
  const bw = 190;
  const bx = CX - bw / 2;
  const bh = 28;

  // Heroicons badge-check (viewBox 0 0 20 20), scaled to 14px
  const iconSize = 14;
  const sc = iconSize / 20;

  // Layout: [icon 14px] [gap 5px] [text ~110px] = ~129px total, centered at CX
  const totalW = 129;
  const iconX = CX - totalW / 2;
  const iconY = y + (bh - iconSize) / 2;
  const textX = iconX + iconSize + 5;
  const textY = y + 18;

  return `
  <rect x="${bx}" y="${y}" width="${bw}" height="${bh}" rx="2" fill="${SEAL}" opacity="0.06"/>
  <rect x="${bx}" y="${y}" width="${bw}" height="${bh}" rx="2" fill="none" stroke="${SEAL}" stroke-width="0.7" opacity="0.3"/>
  <g transform="translate(${iconX},${iconY}) scale(${sc})">
    <path fill="${SEAL_DARK}" fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
  </g>
  <text x="${textX}" y="${textY}" font-family="'IBM Plex Sans'" font-size="10" font-weight="600" fill="${SEAL_DARK}" letter-spacing="1.5">VERIFIED OWNER</text>`;
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
  const ageText = escapeXml(formatAge(birth));

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
  ${cornerAccents()}

  <!-- Inner decorative border (matches inset-6 = 24px) -->
  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="${DIVIDER}" stroke-width="0.5" opacity="0.5"/>

  <!-- Title (text-[10px] tracking-[0.4em] uppercase) -->
  <text x="${CX}" y="108" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="500" fill="${SEAL_DARK}" letter-spacing="4">CERTIFICATE OF WEBSITE LONGEVITY</text>

  <!-- Ornament line with center diamond -->
  ${ornamentLineDiamond(122)}

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
  ${cornerAccents()}

  <rect x="${CARD_X + 24}" y="${CARD_Y + 24}" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="${DIVIDER}" stroke-width="0.5" opacity="0.5"/>

  <text x="${CX}" y="175" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" font-weight="500" fill="${SEAL_DARK}" letter-spacing="4">WEBSITE AGE CERTIFICATE</text>

  ${ornamentLineDiamond(192)}

  <text x="${CX}" y="280" text-anchor="middle" font-family="'DM Serif Display'" font-size="46" fill="${INK}">${domain}</text>

  <text x="${CX}" y="355" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="16" fill="${INK_MUTED}" font-weight="300">Age pending...</text>

  ${ornamentLine(500)}
  <text x="${CX}" y="526" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="9" fill="${INK_MUTED}" opacity="0.5" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
