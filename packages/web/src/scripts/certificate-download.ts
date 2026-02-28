// Certificate Download — Canvas 2D API programmatic rendering
// Pixel-perfect certificate/tombstone drawing, no DOM capture dependencies

// ── Design tokens (matching OG templates & CSS variables) ──────
const SEAL = "#c8a44e";
const SEAL_DARK = "#a8872e";
const INK = "#1a1d2e";
const INK_MUTED = "#6b7094";
const PARCHMENT = "#faf8f4";
const DIVIDER = "#e2ddd3";

const TOMB = "#9f9f9f";
const TOMB_INK = "#6b6b6b";
const TOMB_DIVIDER = "#c8c2b8";

// ── Canvas dimensions ──────────────────────────────────────────
const W = 1200;
const H = 1600;
const SCALE = 4; // 4x → 4800×6400 output

// ── Card layout ────────────────────────────────────────────────
const CARD_X = 100;
const CARD_Y = 80;
const CARD_W = 1000;
const CARD_H = 1440;
const CARD_R = CARD_X + CARD_W;
const CARD_B = CARD_Y + CARD_H;
const CX = W / 2;

// ── Helpers ────────────────────────────────────────────────────

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function yearOf(iso: string): string {
  return new Date(iso).getUTCFullYear().toString();
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ageText(birth: string, end?: string): string {
  const b = new Date(birth);
  const e = end ? new Date(end) : new Date();
  let y = e.getFullYear() - b.getFullYear();
  let m = e.getMonth() - b.getMonth();
  if (m < 0) { y--; m += 12; }
  if (e.getDate() < b.getDate()) { m--; if (m < 0) { y--; m += 12; } }
  const p: string[] = [];
  if (y > 0) p.push(`${y} year${y > 1 ? "s" : ""}`);
  if (m > 0) p.push(`${m} month${m > 1 ? "s" : ""}`);
  return p.length ? p.join(", ") : "< 1 month";
}

// ── Gradient factory ───────────────────────────────────────────

function ornLineGrad(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  divider: string,
  accent: string,
): CanvasGradient {
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, rgba(divider, 0));
  g.addColorStop(0.15, divider);
  g.addColorStop(0.4, accent);
  g.addColorStop(0.6, accent);
  g.addColorStop(0.85, divider);
  g.addColorStop(1, rgba(divider, 0));
  return g;
}

// ── Drawing primitives ─────────────────────────────────────────

function drawCard(
  ctx: CanvasRenderingContext2D,
  baseFill: string,
  gradStops: [string, string],
  borderColor: string,
) {
  // Shadow layer 1: soft, wide
  ctx.save();
  ctx.shadowColor = rgba(INK, 0.04);
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = baseFill;
  ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
  ctx.restore();

  // Shadow layer 2: tight, crisp
  ctx.save();
  ctx.shadowColor = rgba(INK, 0.06);
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = baseFill;
  ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
  ctx.restore();

  // Gradient overlay
  const grad = ctx.createLinearGradient(CARD_X, CARD_Y, CARD_X, CARD_B);
  grad.addColorStop(0, gradStops[0]);
  grad.addColorStop(1, gradStops[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);

  // Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(CARD_X, CARD_Y, CARD_W, CARD_H);
}

function drawCorners(
  ctx: CanvasRenderingContext2D,
  color: string,
  outerAlpha: number,
  innerAlpha: number,
) {
  const LEN = 56;
  const INSET = 16;
  const LEN_I = 20;
  const corners: [number, number][] = [
    [CARD_X, CARD_Y],
    [CARD_R, CARD_Y],
    [CARD_X, CARD_B],
    [CARD_R, CARD_B],
  ];

  ctx.strokeStyle = color;

  // Outer L-shaped corners
  ctx.lineWidth = 2;
  ctx.globalAlpha = outerAlpha;
  for (const [cx, cy] of corners) {
    const dx = cx === CARD_X ? 1 : -1;
    const dy = cy === CARD_Y ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + LEN * dy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + LEN * dx, cy);
    ctx.stroke();
  }

  // Inner L-shaped corners
  ctx.lineWidth = 1;
  ctx.globalAlpha = innerAlpha;
  for (const [cx, cy] of corners) {
    const dx = cx === CARD_X ? 1 : -1;
    const dy = cy === CARD_Y ? 1 : -1;
    const ix = cx + INSET * dx;
    const iy = cy + INSET * dy;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix, iy + LEN_I * dy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + LEN_I * dx, iy);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawCornerDiamonds(
  ctx: CanvasRenderingContext2D,
  color: string,
  alpha: number,
) {
  const d = 3;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (const [x, y] of [
    [CARD_X, CARD_Y],
    [CARD_R, CARD_Y],
    [CARD_X, CARD_B],
    [CARD_R, CARD_B],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x, y - d);
    ctx.lineTo(x + d, y);
    ctx.lineTo(x, y + d);
    ctx.lineTo(x - d, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawInnerBorder(
  ctx: CanvasRenderingContext2D,
  color: string,
  alpha: number,
) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(
    CARD_X + 24,
    CARD_Y + 24,
    CARD_W - 48,
    CARD_H - 48,
  );
  ctx.globalAlpha = 1;
}

function drawOrnamentLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  hw: number,
  divider: string,
  accent: string,
) {
  ctx.fillStyle = ornLineGrad(ctx, CX - hw, CX + hw, divider, accent);
  ctx.fillRect(CX - hw, y, hw * 2, 1);
}

function drawOrnamentDiamond(
  ctx: CanvasRenderingContext2D,
  y: number,
  hw: number,
  divider: string,
  accent: string,
  diamondAlpha: number = 0.3,
) {
  const d = 3;
  const gap = d + 2;

  // Left segment
  ctx.fillStyle = ornLineGrad(ctx, CX - hw, CX - gap, divider, accent);
  ctx.fillRect(CX - hw, y, hw - gap, 1);

  // Right segment
  ctx.fillStyle = ornLineGrad(ctx, CX + gap, CX + hw, divider, accent);
  ctx.fillRect(CX + gap, y, hw - gap, 1);

  // Center diamond
  ctx.globalAlpha = diamondAlpha;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(CX, y - d);
  ctx.lineTo(CX + d, y + 0.5);
  ctx.lineTo(CX, y + d + 1);
  ctx.lineTo(CX - d, y + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawYearGlow(
  ctx: CanvasRenderingContext2D,
  cy: number,
  color: string,
) {
  const rx = 180;
  const ry = 80;
  ctx.save();
  ctx.translate(CX, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(color, 0.08));
  g.addColorStop(0.7, rgba(color, 0.03));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Heroicons badge-check (20×20 viewBox)
const BADGE_CHECK_PATH =
  "M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z";

function drawVerifiedBadge(ctx: CanvasRenderingContext2D, y: number) {
  const bw = 230;
  const bh = 34;
  const bx = CX - bw / 2;

  // Background rect
  ctx.fillStyle = rgba(SEAL, 0.06);
  ctx.fillRect(bx, y, bw, bh);

  // Border
  ctx.strokeStyle = rgba(SEAL, 0.3);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(bx, y, bw, bh);

  // Icon
  const iconSize = 16;
  const sc = iconSize / 20;
  const totalContentW = 152;
  const iconX = CX - totalContentW / 2;
  const iconY = y + (bh - iconSize) / 2;

  ctx.save();
  ctx.translate(iconX, iconY);
  ctx.scale(sc, sc);
  ctx.fillStyle = SEAL_DARK;
  const path = new Path2D(BADGE_CHECK_PATH);
  ctx.fill(path, "evenodd");
  ctx.restore();

  // Text
  ctx.save();
  ctx.font = '600 12px "IBM Plex Sans"';
  ctx.fillStyle = SEAL_DARK;
  ctx.textAlign = "left";
  ctx.letterSpacing = "1.5px";
  ctx.fillText("VERIFIED OWNER", iconX + iconSize + 6, y + 22);
  ctx.restore();
}

/** Shrink font size to fit text within maxWidth */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  fontFamily: string,
  fontWeight: string = "400",
): number {
  let size = startSize;
  ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && size > 16) {
    size -= 2;
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
  }
  return size;
}

// ── Certificate (active site) ──────────────────────────────────

function drawCertificate(ctx: CanvasRenderingContext2D, data: CertData) {
  const birth = data.birthAt!;
  const year = yearOf(birth);
  const date = fullDate(birth);
  const age = ageText(birth);
  const v = data.isVerified ? 40 : 0;

  // Background
  ctx.fillStyle = "#f0ece4";
  ctx.fillRect(0, 0, W, H);

  // Card
  drawCard(ctx, "#ffffff", ["#ffffff", rgba(PARCHMENT, 0.85)], DIVIDER);
  drawCorners(ctx, SEAL, 0.3, 0.15);
  drawCornerDiamonds(ctx, SEAL, 0.2);
  drawInnerBorder(ctx, DIVIDER, 0.5);

  // Title
  ctx.save();
  ctx.font = '500 13px "IBM Plex Sans"';
  ctx.fillStyle = SEAL_DARK;
  ctx.textAlign = "center";
  ctx.letterSpacing = "5px";
  ctx.fillText("CERTIFICATE OF WEBSITE LONGEVITY", CX, 280);
  ctx.restore();

  // Ornament with diamond
  drawOrnamentDiamond(ctx, 308, 120, DIVIDER, SEAL);

  // Domain (auto-shrink for long names)
  ctx.save();
  const domainMaxW = CARD_W - 80;
  const domainSize = fitFontSize(
    ctx, data.domain, domainMaxW, 54, '"DM Serif Display"',
  );
  ctx.font = `${domainSize}px "DM Serif Display"`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText(data.domain, CX, data.isVerified ? 460 : 480);
  ctx.restore();

  // Verified badge
  if (data.isVerified) {
    drawVerifiedBadge(ctx, 500);
  }

  // Label
  ctx.save();
  ctx.font = '400 13px "IBM Plex Sans"';
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText(
    data.isVerified ? "ESTABLISHED" : "ONLINE SINCE",
    CX,
    600 + v,
  );
  ctx.restore();

  // Year glow
  drawYearGlow(ctx, 730 + v, SEAL);

  // Year
  ctx.save();
  ctx.font = '120px "DM Serif Display"';
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText(year, CX, 770 + v);
  ctx.restore();

  // Full date
  ctx.save();
  ctx.font = '300 16px "IBM Plex Sans"';
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = "center";
  ctx.fillText(date, CX, 830 + v);
  ctx.restore();

  // Ornament divider
  drawOrnamentLine(ctx, 870 + v, 80, DIVIDER, SEAL);

  // Age (mixed formatting: "Age: " muted + value bold)
  ctx.save();
  ctx.textAlign = "left";
  const ageLabel = "Age: ";
  ctx.font = '400 16px "IBM Plex Sans"';
  const labelW = ctx.measureText(ageLabel).width;
  ctx.font = '500 16px "IBM Plex Sans"';
  const valueW = ctx.measureText(age).width;
  const ageStartX = CX - (labelW + valueW) / 2;

  ctx.font = '400 16px "IBM Plex Sans"';
  ctx.fillStyle = INK_MUTED;
  ctx.fillText(ageLabel, ageStartX, 910 + v);

  ctx.font = '500 16px "IBM Plex Sans"';
  ctx.fillStyle = INK;
  ctx.fillText(age, ageStartX + labelW, 910 + v);
  ctx.restore();

  // Footer
  drawOrnamentLine(ctx, 1390, 80, DIVIDER, SEAL);

  ctx.save();
  ctx.font = '400 11px "IBM Plex Sans"';
  ctx.fillStyle = INK_MUTED;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "center";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(
    "CERTIFIED BY SITEAGE.ORG \u00B7 DATA FROM INTERNET ARCHIVE",
    CX,
    1420,
  );
  ctx.restore();
}

// ── Tombstone (dead site) ──────────────────────────────────────

function drawTombstone(ctx: CanvasRenderingContext2D, data: CertData) {
  const birth = data.birthAt;
  const deathYear = data.deathAt ? yearOf(data.deathAt) : "?";
  const yearRange = birth ? `${yearOf(birth)} \u2014 ${deathYear}` : "";
  const survival = birth
    ? `Survived for ${ageText(birth, data.deathAt || undefined)}`
    : "";

  // Background
  ctx.fillStyle = "#e0dcd5";
  ctx.fillRect(0, 0, W, H);

  // Card (grey tones)
  drawCard(ctx, "#eae6df", ["#efecea", "#eae6df"], TOMB_DIVIDER);
  drawCorners(ctx, TOMB, 0.25, 0.12);
  drawCornerDiamonds(ctx, TOMB, 0.15);
  drawInnerBorder(ctx, TOMB_DIVIDER, 0.4);

  // Title
  ctx.save();
  ctx.font = '500 13px "IBM Plex Sans"';
  ctx.fillStyle = TOMB;
  ctx.textAlign = "center";
  ctx.letterSpacing = "5px";
  ctx.fillText("IN MEMORIAM", CX, 280);
  ctx.restore();

  // Ornament
  drawOrnamentDiamond(ctx, 308, 100, TOMB_DIVIDER, TOMB, 0.2);

  // Domain
  ctx.save();
  const domainSize = fitFontSize(
    ctx, data.domain, CARD_W - 80, 48, '"DM Serif Display"',
  );
  ctx.font = `${domainSize}px "DM Serif Display"`;
  ctx.fillStyle = TOMB_INK;
  ctx.textAlign = "center";
  ctx.fillText(data.domain, CX, 500);
  ctx.restore();

  // R.I.P
  ctx.save();
  ctx.font = '72px "DM Serif Display"';
  ctx.fillStyle = TOMB;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "center";
  ctx.fillText("R.I.P", CX, 700);
  ctx.restore();

  // Year range
  if (yearRange) {
    ctx.save();
    ctx.font = '28px "DM Serif Display"';
    ctx.fillStyle = TOMB;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = "center";
    ctx.fillText(yearRange, CX, 770);
    ctx.restore();
  }

  // Survival text
  if (survival) {
    ctx.save();
    ctx.font = '300 16px "IBM Plex Sans"';
    ctx.fillStyle = TOMB;
    ctx.globalAlpha = 0.4;
    ctx.textAlign = "center";
    ctx.fillText(survival, CX, 830);
    ctx.restore();
  }

  // Footer
  drawOrnamentLine(ctx, 1390, 150, TOMB_DIVIDER, TOMB);

  ctx.save();
  ctx.font = '400 11px "IBM Plex Sans"';
  ctx.fillStyle = TOMB;
  ctx.globalAlpha = 0.4;
  ctx.textAlign = "center";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(
    "REMEMBERED BY SITEAGE.ORG \u00B7 DATA FROM INTERNET ARCHIVE",
    CX,
    1420,
  );
  ctx.restore();
}

// ── Unknown (no birth date yet) ────────────────────────────────

function drawUnknown(ctx: CanvasRenderingContext2D, data: CertData) {
  // Background
  ctx.fillStyle = "#f0ece4";
  ctx.fillRect(0, 0, W, H);

  // Card
  drawCard(ctx, "#ffffff", ["#ffffff", rgba(PARCHMENT, 0.85)], DIVIDER);
  drawCorners(ctx, SEAL, 0.3, 0.15);
  drawCornerDiamonds(ctx, SEAL, 0.2);
  drawInnerBorder(ctx, DIVIDER, 0.5);

  // Title
  ctx.save();
  ctx.font = '500 13px "IBM Plex Sans"';
  ctx.fillStyle = SEAL_DARK;
  ctx.textAlign = "center";
  ctx.letterSpacing = "5px";
  ctx.fillText("WEBSITE AGE CERTIFICATE", CX, 300);
  ctx.restore();

  // Ornament
  drawOrnamentDiamond(ctx, 328, 120, DIVIDER, SEAL);

  // Domain
  ctx.save();
  const domainSize = fitFontSize(
    ctx, data.domain, CARD_W - 80, 54, '"DM Serif Display"',
  );
  ctx.font = `${domainSize}px "DM Serif Display"`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText(data.domain, CX, 560);
  ctx.restore();

  // Pending text
  ctx.save();
  ctx.font = '300 20px "IBM Plex Sans"';
  ctx.fillStyle = INK_MUTED;
  ctx.textAlign = "center";
  ctx.fillText("Age pending\u2026", CX, 700);
  ctx.restore();

  // Footer
  drawOrnamentLine(ctx, 1390, 80, DIVIDER, SEAL);

  ctx.save();
  ctx.font = '400 11px "IBM Plex Sans"';
  ctx.fillStyle = INK_MUTED;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "center";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(
    "CERTIFIED BY SITEAGE.ORG \u00B7 DATA FROM INTERNET ARCHIVE",
    CX,
    1420,
  );
  ctx.restore();
}

// ── Public API ─────────────────────────────────────────────────

export interface CertData {
  domain: string;
  birthAt: string | null;
  deathAt: string | null;
  isDead: boolean;
  isVerified: boolean;
  createdAt: string;
}

export async function downloadCertificate(data: CertData): Promise<void> {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  if (data.isDead) {
    drawTombstone(ctx, data);
  } else if (data.birthAt) {
    drawCertificate(ctx, data);
  } else {
    drawUnknown(ctx, data);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `siteage-${data.domain}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
