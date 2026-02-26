import { birthYear, formatAge } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Shared corner ornaments — double-layer L-shapes matching the page design */
function cornerOrnaments(): string {
  return `
  <!-- Outer corner ornaments -->
  <path d="M36 36 L36 100" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M36 36 L100 36" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M1164 36 L1164 100" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M1164 36 L1100 36" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M36 594 L36 530" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M36 594 L100 594" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M1164 594 L1164 530" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <path d="M1164 594 L1100 594" stroke="#c8a44e" stroke-width="2.5" fill="none" opacity="0.35"/>
  <!-- Inner corner ornaments (smaller) -->
  <path d="M52 52 L52 72" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M52 52 L72 52" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M1148 52 L1148 72" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M1148 52 L1128 52" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M52 578 L52 558" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M52 578 L72 578" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M1148 578 L1148 558" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>
  <path d="M1148 578 L1128 578" stroke="#c8a44e" stroke-width="1" fill="none" opacity="0.18"/>`;
}

/** Ornamental divider with diamond */
function ornamentDivider(y: number, halfWidth: number = 120): string {
  const cx = 600;
  return `
  <line x1="${cx - halfWidth - 30}" y1="${y}" x2="${cx - 10}" y2="${y}" stroke="#c8a44e" stroke-width="0.8" opacity="0.5"/>
  <text x="${cx}" y="${y + 5}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="12" fill="#c8a44e" opacity="0.6">&#x25C6;</text>
  <line x1="${cx + 10}" y1="${y}" x2="${cx + halfWidth + 30}" y2="${y}" stroke="#c8a44e" stroke-width="0.8" opacity="0.5"/>`;
}

/** Simple horizontal divider */
function simpleDivider(y: number, halfWidth: number = 100): string {
  return `<line x1="${600 - halfWidth}" y1="${y}" x2="${600 + halfWidth}" y2="${y}" stroke="#e8e0d0" stroke-width="0.8"/>`;
}

/** Verified owner badge — matches page design with shield icon */
function verifiedBadge(y: number): string {
  // Center the badge content: shield (14px) + gap (6px) + text (~120px) ≈ 140px total
  // Badge center at x=600, so content starts at ~530
  const sx = 530; // shield left edge
  const sy = y + 3;
  return `
  <rect x="470" y="${y}" width="260" height="32" rx="2" fill="none" stroke="#c8a44e" stroke-width="0.8" opacity="0.35"/>
  <rect x="470" y="${y}" width="260" height="32" rx="2" fill="#c8a44e" opacity="0.06"/>
  <!-- Shield icon -->
  <path d="M${sx} ${sy + 2} l5.5-2.5a2 2 0 012 0l5.5 2.5v9a7 7 0 01-3.2 5.9l-2.3 1.6a2 2 0 01-2 0l-2.3-1.6a7 7 0 01-3.2-5.9z" fill="#a8872e" opacity="0.85"/>
  <polyline points="${sx + 4} ${sy + 10} ${sx + 6} ${sy + 12.5} ${sx + 9.5} ${sy + 7}" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="614" y="${y + 21}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="11" font-weight="600" fill="#a8872e" letter-spacing="2.5">VERIFIED OWNER</text>`;
}

export function renderCertificateSvg(data: BadgeData): string {
  const birth = data.verified_birth_at || data.birth_at;
  const isVerified = data.verification_status === "verified";
  const domain = escapeXml(data.domain);

  // Unknown state — no birth data
  if (!birth) {
    return renderUnknownSvg(domain);
  }

  const year = birthYear(birth);
  const d = new Date(birth);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fullDate = `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  const ageText = formatAge(birth);

  // Layout positioning — shift content down when verified badge is shown
  const vOffset = isVerified ? 30 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Subtle radial glow behind the year -->
    <radialGradient id="yearGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c8a44e" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#c8a44e" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background — parchment gradient -->
  <rect width="1200" height="630" fill="#faf8f4"/>
  <rect width="1200" height="630" fill="url(#bg)" opacity="0.5"/>

  ${cornerOrnaments()}

  <!-- Inner decorative border -->
  <rect x="70" y="70" width="1060" height="490" fill="none" stroke="#e8e0d0" stroke-width="0.5" opacity="0.6"/>

  <!-- Title -->
  <text x="600" y="125" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="11" font-weight="600" fill="#a8872e" letter-spacing="5">CERTIFICATE OF WEBSITE LONGEVITY</text>

  ${ornamentDivider(148)}

  <!-- Domain name -->
  <text x="600" y="${210 + (isVerified ? 0 : 10)}" text-anchor="middle" font-family="'DM Serif Display'" font-size="48" fill="#1a1d2e">${domain}</text>

  <!-- Verification badge -->
  ${isVerified ? verifiedBadge(240) : ""}

  <!-- Online Since / Established label -->
  <text x="600" y="${295 + vOffset}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="11" fill="#6b7094" letter-spacing="3">${isVerified ? "ESTABLISHED" : "ONLINE SINCE"}</text>

  <!-- Gold glow behind year -->
  <ellipse cx="600" cy="${365 + vOffset}" rx="140" ry="60" fill="url(#yearGlow)"/>

  <!-- Year (large) -->
  <text x="600" y="${380 + vOffset}" text-anchor="middle" font-family="'DM Serif Display'" font-size="80" fill="#1a1d2e">${year}</text>

  <!-- Full date -->
  <text x="600" y="${412 + vOffset}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="14" fill="#6b7094" font-weight="300">${fullDate}</text>

  <!-- Divider -->
  ${simpleDivider(440 + vOffset)}

  <!-- Age text -->
  <text x="600" y="${468 + vOffset}" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="15" fill="#1a1d2e">
    <tspan fill="#6b7094">Age: </tspan><tspan font-weight="600">${ageText}</tspan>
  </text>

  <!-- Footer divider -->
  ${simpleDivider(540, 200)}

  <!-- Brand footer -->
  <text x="600" y="570" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" fill="#6b7094" opacity="0.5" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}

function renderUnknownSvg(domain: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#faf8f4"/>

  ${cornerOrnaments()}

  <!-- Inner decorative border -->
  <rect x="70" y="70" width="1060" height="490" fill="none" stroke="#e8e0d0" stroke-width="0.5" opacity="0.6"/>

  <!-- Title -->
  <text x="600" y="180" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="11" font-weight="600" fill="#a8872e" letter-spacing="5">WEBSITE AGE CERTIFICATE</text>

  ${ornamentDivider(205)}

  <!-- Domain name -->
  <text x="600" y="290" text-anchor="middle" font-family="'DM Serif Display'" font-size="48" fill="#1a1d2e">${domain}</text>

  <!-- Pending text -->
  <text x="600" y="370" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="18" fill="#6b7094" font-weight="300">Age pending...</text>

  <!-- Footer divider -->
  ${simpleDivider(500, 200)}

  <!-- Brand footer -->
  <text x="600" y="530" text-anchor="middle" font-family="'IBM Plex Sans'" font-size="10" fill="#6b7094" opacity="0.5" letter-spacing="1.5">CERTIFIED BY SITEAGE.ORG &#xB7; DATA FROM INTERNET ARCHIVE</text>
</svg>`;
}
