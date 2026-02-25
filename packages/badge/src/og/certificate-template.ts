import { birthYear, formatAge, ageYears } from "@siteage/shared";
import type { BadgeData } from "@siteage/shared";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
  const years = ageYears(birth);
  const ageText = `${years} year${years !== 1 ? "s" : ""} online`;

  // Verified badge block
  const verifiedBlock = isVerified
    ? `<rect x="420" y="308" width="360" height="30" rx="4" fill="#c8a44e" opacity="0.15"/>
       <text x="600" y="328" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" fill="#a8872e" letter-spacing="3" text-decoration="none">
         <tspan>&#x2713; VERIFIED OWNER</tspan>
       </text>`
    : "";

  const verifiedYOffset = isVerified ? 50 : 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#faf8f4"/>

  <!-- Corner ornaments -->
  <path d="M40 40 L40 100" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M40 40 L100 40" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 40 L1160 100" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 40 L1100 40" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M40 590 L40 530" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M40 590 L100 590" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 590 L1160 530" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 590 L1100 590" stroke="#c8a44e" stroke-width="2.5" fill="none"/>

  <!-- Inner border -->
  <rect x="60" y="60" width="1080" height="510" fill="none" stroke="#e8e0d0" stroke-width="0.5"/>

  <!-- Title -->
  <text x="600" y="120" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" fill="#a8872e" letter-spacing="5">CERTIFICATE OF WEBSITE LONGEVITY</text>

  <!-- Ornamental divider -->
  <line x1="450" y1="145" x2="560" y2="145" stroke="#c8a44e" stroke-width="0.8" opacity="0.6"/>
  <text x="600" y="150" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#c8a44e" opacity="0.8">&#x25C6;</text>
  <line x1="640" y1="145" x2="750" y2="145" stroke="#c8a44e" stroke-width="0.8" opacity="0.6"/>

  <!-- Domain name -->
  <text x="600" y="220" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="48" fill="#1a1d2e">${domain}</text>

  <!-- Verification badge -->
  ${verifiedBlock}

  <!-- Online Since label -->
  <text x="600" y="${310 + verifiedYOffset}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#6b7094" letter-spacing="3">${isVerified ? "ESTABLISHED" : "ONLINE SINCE"}</text>

  <!-- Year (large) -->
  <text x="600" y="${390 + verifiedYOffset}" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="80" fill="#1a1d2e">${year}</text>

  <!-- Full date -->
  <text x="600" y="${420 + verifiedYOffset}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#6b7094">${fullDate}</text>

  <!-- Divider -->
  <line x1="470" y1="${450 + verifiedYOffset}" x2="730" y2="${450 + verifiedYOffset}" stroke="#e8e0d0" stroke-width="0.8"/>

  <!-- Age text -->
  <text x="600" y="${478 + verifiedYOffset}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#1a1d2e" font-weight="500">${ageText}</text>

  <!-- Brand footer -->
  <text x="600" y="${560 + verifiedYOffset > 580 ? 580 : 560 + verifiedYOffset}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7094" opacity="0.7">siteage.org &#xB7; Powered by Wayback Machine</text>
</svg>`;
}

function renderUnknownSvg(domain: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#faf8f4"/>

  <!-- Corner ornaments -->
  <path d="M40 40 L40 100" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M40 40 L100 40" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 40 L1160 100" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 40 L1100 40" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M40 590 L40 530" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M40 590 L100 590" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 590 L1160 530" stroke="#c8a44e" stroke-width="2.5" fill="none"/>
  <path d="M1160 590 L1100 590" stroke="#c8a44e" stroke-width="2.5" fill="none"/>

  <!-- Inner border -->
  <rect x="60" y="60" width="1080" height="510" fill="none" stroke="#e8e0d0" stroke-width="0.5"/>

  <!-- Title -->
  <text x="600" y="180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" fill="#a8872e" letter-spacing="5">WEBSITE AGE CERTIFICATE</text>

  <!-- Ornamental divider -->
  <line x1="450" y1="205" x2="560" y2="205" stroke="#c8a44e" stroke-width="0.8" opacity="0.6"/>
  <text x="600" y="210" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#c8a44e" opacity="0.8">&#x25C6;</text>
  <line x1="640" y1="205" x2="750" y2="205" stroke="#c8a44e" stroke-width="0.8" opacity="0.6"/>

  <!-- Domain name -->
  <text x="600" y="290" text-anchor="middle" font-family="'DM Serif Display', Georgia, serif" font-size="48" fill="#1a1d2e">${domain}</text>

  <!-- Pending text -->
  <text x="600" y="370" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#6b7094">Age pending...</text>

  <!-- Brand footer -->
  <text x="600" y="530" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#6b7094" opacity="0.7">siteage.org &#xB7; Powered by Wayback Machine</text>
</svg>`;
}
