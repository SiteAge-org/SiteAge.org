import { toPng } from "html-to-image";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const CARD_WIDTH = 880;

/**
 * Capture a certificate/tombstone card DOM element as a PNG and trigger download.
 */
export async function downloadCertificate(
  sourceEl: HTMLElement,
  domain: string
): Promise<void> {
  // Create offscreen container at fixed OG dimensions
  const container = document.createElement("div");
  container.style.cssText = [
    "position: fixed",
    "left: -9999px",
    "top: 0",
    `width: ${OG_WIDTH}px`,
    `height: ${OG_HEIGHT}px`,
    "overflow: hidden",
    "background: #faf8f4", // parchment base color
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "z-index: -1",
  ].join(";");
  document.body.appendChild(container);

  try {
    // Clone the card into the container
    const clone = sourceEl.cloneNode(true) as HTMLElement;

    // Remove interactive elements (buttons, links that are actions)
    clone.querySelectorAll("#recheck-btn").forEach((el) => el.remove());

    // Set fixed width to match SVG template proportions
    clone.style.width = `${CARD_WIDTH}px`;
    clone.style.maxWidth = "none";
    clone.style.margin = "0";
    // Remove animation classes that might affect rendering
    clone.style.animation = "none";
    clone.style.opacity = "1";
    clone.style.transform = "none";

    container.appendChild(clone);

    // Wait for fonts to be ready
    await document.fonts.ready;

    const dataUrl = await toPng(container, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      pixelRatio: 1,
      cacheBust: true,
    });

    // Trigger download
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `siteage-${domain}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    container.remove();
  }
}
