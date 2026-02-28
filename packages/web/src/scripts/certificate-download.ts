import html2canvas from "html2canvas";

// Portrait 3:4, high-res output (4800×6400)
const BASE_W = 1200;
const BASE_H = 1600;
const SCALE = 4;
const BG_COLOR = "#faf8f4";

/**
 * Capture a certificate/tombstone card as a high-res portrait PNG
 * and trigger download.
 *
 * html2canvas is patched (pnpm patch) to support oklab/oklch colors
 * that Tailwind v4 generates.
 */
export async function downloadCertificate(
  sourceEl: HTMLElement,
  domain: string,
): Promise<void> {
  await document.fonts.ready;

  const captured = await html2canvas(sourceEl, {
    backgroundColor: null,
    scale: SCALE,
    useCORS: true,
    logging: false,
    onclone: (_doc, clonedEl) => {
      clonedEl.querySelectorAll("#recheck-btn").forEach((n) => n.remove());
      // Remove noise-overlay: its SVG feTurbulence filter background
      // can't be rasterised by html2canvas (produces a 0×0 canvas).
      clonedEl.classList.remove("noise-overlay");
    },
  });

  // Compose onto portrait canvas with card centered
  const outW = BASE_W * SCALE;
  const outH = BASE_H * SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, outW, outH);

  const padding = 0.88;
  const fitScale = Math.min(
    (outW * padding) / captured.width,
    (outH * padding) / captured.height,
  );
  const w = captured.width * fitScale;
  const h = captured.height * fitScale;
  const x = (outW - w) / 2;
  const y = (outH - h) / 2;
  ctx.drawImage(captured, x, y, w, h);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `siteage-${domain}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
