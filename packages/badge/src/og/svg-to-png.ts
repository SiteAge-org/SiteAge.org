import { Resvg, initWasm } from "@resvg/resvg-wasm";
// @ts-expect-error — wasm binary import handled by wrangler
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
// @ts-expect-error — binary asset import handled by wrangler
import dmSerifFont from "./DM-Serif-Display.ttf";
// @ts-expect-error — binary asset import handled by wrangler
import plexRegular from "./IBM-Plex-Sans-Regular.ttf";
// @ts-expect-error — binary asset import handled by wrangler
import plexSemiBold from "./IBM-Plex-Sans-SemiBold.ttf";

let initialized = false;

async function ensureInit(): Promise<void> {
  if (initialized) return;
  await initWasm(resvgWasm);
  initialized = true;
}

export async function svgToPng(svg: string): Promise<Uint8Array> {
  await ensureInit();

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      fontBuffers: [
        new Uint8Array(dmSerifFont as ArrayBuffer),
        new Uint8Array(plexRegular as ArrayBuffer),
        new Uint8Array(plexSemiBold as ArrayBuffer),
      ],
      defaultFontFamily: "IBM Plex Sans",
      sansSerifFamily: "IBM Plex Sans",
      serifFamily: "DM Serif Display",
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}
