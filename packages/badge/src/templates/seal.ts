import type { TemplateParams } from "./flat.js";

export function renderSeal(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth;
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <clipPath id="r">
    <rect width="${totalWidth}" height="24" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${p.labelWidth}" height="24" fill="#3d2e1a"/>
    <rect x="${p.labelWidth}" width="${p.messageWidth}" height="24" fill="#4a3620"/>
  </g>
  <rect width="${totalWidth - 1}" height="23" x=".5" y=".5" rx="2.5" fill="none" stroke="#f0d060" stroke-opacity=".8"/>
  <rect width="${totalWidth - 5}" height="19" x="2.5" y="2.5" rx="1" fill="none" stroke="#f0d060" stroke-opacity=".3"/>
  <g text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX * 10}" y="170" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text x="${labelX * 10}" y="160" transform="scale(.1)" fill="#f0d060" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text aria-hidden="true" x="${messageX * 10}" y="170" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
    <text x="${messageX * 10}" y="160" transform="scale(.1)" fill="#f5e6c4" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
