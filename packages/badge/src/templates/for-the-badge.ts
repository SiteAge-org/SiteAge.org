import type { TemplateParams } from "./flat.js";

export function renderForTheBadge(p: TemplateParams): string {
  const totalWidth = p.labelWidth + p.messageWidth;
  const labelX = p.labelWidth / 2;
  const messageX = p.labelWidth + p.messageWidth / 2;
  const label = p.label.toUpperCase();
  const message = p.message.toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="${escapeXml(p.label)}: ${escapeXml(p.message)}">
  <title>${escapeXml(p.label)}: ${escapeXml(p.message)}</title>
  <g shape-rendering="crispEdges">
    <rect width="${p.labelWidth}" height="28" fill="#555"/>
    <rect x="${p.labelWidth}" width="${p.messageWidth}" height="28" fill="${p.color}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="100">
    <text aria-hidden="true" x="${labelX * 10}" y="195" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.labelWidth - 18) * 10}">${escapeXml(label)}</text>
    <text x="${labelX * 10}" y="185" transform="scale(.1)" fill="#fff" textLength="${(p.labelWidth - 18) * 10}">${escapeXml(label)}</text>
    <text aria-hidden="true" x="${messageX * 10}" y="195" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(p.messageWidth - 18) * 10}">${escapeXml(message)}</text>
    <text x="${messageX * 10}" y="185" transform="scale(.1)" fill="#fff" textLength="${(p.messageWidth - 18) * 10}">${escapeXml(message)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
