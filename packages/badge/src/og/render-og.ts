import type { BadgeData } from "@siteage/shared";
import { renderCertificateSvg } from "./certificate-template.js";
import { renderTombstoneSvg } from "./tombstone-template.js";
import { svgToPng } from "./svg-to-png.js";

export async function renderOgImage(data: BadgeData): Promise<Uint8Array> {
  const svg = data.status === "dead"
    ? renderTombstoneSvg(data)
    : renderCertificateSvg(data);

  return svgToPng(svg);
}
