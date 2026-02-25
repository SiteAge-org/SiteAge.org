import type { TemplateParams } from "./flat.js";

export function renderSocial(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth + 1; // +1 for border gap
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="9" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${p.labelWidth}" height="20" fill="#555"/>
    <rect x="${p.labelWidth}" width="${p.messageWidth + 1}" height="20" fill="#fafafa"/>
  </g>
  <rect width="${totalWidth - 1}" height="19" x=".5" y=".5" rx="8.5" fill="none" stroke="#c8c8c8" stroke-opacity=".75"/>
  <g text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text aria-hidden="true" x="${messageX * 10 + 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
    <text x="${messageX * 10 + 5}" y="140" transform="scale(.1)" fill="#333" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
