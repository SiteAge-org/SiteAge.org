import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  trailingSlash: "never",
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
