import { Resvg, initWasm } from "@resvg/resvg-wasm";
// @ts-expect-error — wasm binary import handled by wrangler
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import { dmSerifDisplay, ibmPlexSansRegular, ibmPlexSansSemiBold } from "./font-data.js";

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
      fontBuffers: [dmSerifDisplay, ibmPlexSansRegular, ibmPlexSansSemiBold],
      defaultFontFamily: "IBM Plex Sans",
      sansSerifFamily: "IBM Plex Sans",
      serifFamily: "DM Serif Display",
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}
