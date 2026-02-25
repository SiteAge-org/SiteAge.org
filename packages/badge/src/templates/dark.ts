import type { TemplateParams } from "./flat.js";

export function renderDark(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth;
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <linearGradient id="dl" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".05"/>
    <stop offset="1" stop-opacity=".05"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${p.labelWidth}" height="20" fill="#1a1d2e"/>
    <rect x="${p.labelWidth}" width="${p.messageWidth}" height="20" fill="#2d3148"/>
    <rect width="${totalWidth}" height="20" fill="url(#dl)"/>
  </g>
  <rect width="${totalWidth - 1}" height="19" x=".5" y=".5" rx="2.5" fill="none" stroke="#000" stroke-opacity=".2"/>
  <g text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#e0e4f0" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text aria-hidden="true" x="${messageX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
    <text x="${messageX * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
