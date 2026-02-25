import type { TemplateParams } from "./flat.js";

export function renderMinimal(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth;
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${totalWidth}" height="20" fill="none"/>
  </g>
  <rect width="${totalWidth - 1}" height="19" x=".5" y=".5" rx="2.5" fill="none" stroke="#c0c0c0"/>
  <line x1="${p.labelWidth}" y1="4" x2="${p.labelWidth}" y2="16" stroke="#c0c0c0" stroke-width="1"/>
  <g text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#555" textLength="${(p.labelWidth - 10) * 10}">${escapeXml(p.label)}</text>
    <text x="${messageX * 10}" y="140" transform="scale(.1)" fill="#333" textLength="${(p.messageWidth - 10) * 10}">${escapeXml(p.message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
