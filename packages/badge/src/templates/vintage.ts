import type { TemplateParams } from "./flat.js";

export function renderVintage(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth;
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <linearGradient id="vl" x2="0" y2="100%">
    <stop offset="0" stop-color="#6b5533"/>
    <stop offset="1" stop-color="#4a3920"/>
  </linearGradient>
  <linearGradient id="vm" x2="0" y2="100%">
    <stop offset="0" stop-color="#ebe1d0"/>
    <stop offset="1" stop-color="#d4c5a9"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${p.labelWidth}" height="20" fill="url(#vl)"/>
    <rect x="${p.labelWidth}" width="${p.messageWidth}" height="20" fill="url(#vm)"/>
  </g>
  <rect width="${totalWidth - 1}" height="19" x=".5" y=".5" rx="2.5" fill="none" stroke="#8a7450" stroke-opacity=".5"/>
  <g text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".2" transform="scale(.1)" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#f5eed9" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text aria-hidden="true" x="${messageX * 10}" y="150" fill="#010101" fill-opacity=".1" transform="scale(.1)" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
    <text x="${messageX * 10}" y="140" transform="scale(.1)" fill="#4a3c28" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
