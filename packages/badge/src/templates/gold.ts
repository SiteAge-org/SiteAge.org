import type { TemplateParams } from "./flat.js";

export function renderGold(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth;
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <linearGradient id="gl" x2="0" y2="100%">
    <stop offset="0" stop-color="#7a5c10"/>
    <stop offset="1" stop-color="#5a420a"/>
  </linearGradient>
  <linearGradient id="gm" x2="0" y2="100%">
    <stop offset="0" stop-color="#f5e6a3"/>
    <stop offset=".5" stop-color="#d4a017"/>
    <stop offset="1" stop-color="#a8872e"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${p.labelWidth}" height="20" fill="url(#gl)"/>
    <rect x="${p.labelWidth}" width="${p.messageWidth}" height="20" fill="url(#gm)"/>
  </g>
  <g text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text aria-hidden="true" x="${messageX * 10}" y="150" fill="#010101" fill-opacity=".1" transform="scale(.1)" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
    <text x="${messageX * 10}" y="140" transform="scale(.1)" fill="#3a2e00" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
