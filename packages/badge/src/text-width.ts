/**
 * Approximate text width calculation for SVG badges.
 * Uses pre-computed average character widths for Verdana font (the shields.io standard).
 * No DOM required - works in Workers environment.
 */

// Average character widths at 11px Verdana (in SVG units * 10 for precision)
const CHAR_WIDTHS: Record<string, number> = {
  " ": 34, "!": 39, '"': 48, "#": 75, $: 60, "%": 85, "&": 71, "'": 27,
  "(": 39, ")": 39, "*": 48, "+": 75, ",": 34, "-": 39, ".": 34, "/": 39,
  "0": 60, "1": 60, "2": 60, "3": 60, "4": 60, "5": 60, "6": 60, "7": 60,
  "8": 60, "9": 60, ":": 39, ";": 39, "<": 75, "=": 75, ">": 75, "?": 55,
  "@": 95, A: 68, B: 68, C: 69, D: 72, E: 63, F: 58, G: 75, H: 72, I: 30,
  J: 47, K: 68, L: 57, M: 83, N: 72, O: 76, P: 63, Q: 76, R: 68, S: 65,
  T: 60, U: 72, V: 66, W: 93, X: 63, Y: 60, Z: 63,
  a: 56, b: 60, c: 52, d: 60, e: 56, f: 33, g: 60, h: 60, i: 26, j: 30,
  k: 56, l: 26, m: 86, n: 60, o: 58, p: 60, q: 60, r: 38, s: 49, t: 37,
  u: 60, v: 54, w: 78, x: 54, y: 54, z: 50,
};

const DEFAULT_WIDTH = 60;

export function measureText(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) {
    width += (CHAR_WIDTHS[char] || DEFAULT_WIDTH);
  }
  // Scale from 11px reference to target font size
  return Math.ceil((width * fontSize) / (11 * 10));
}
