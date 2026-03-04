import type { APIRoute } from "astro";
import { API_BASE_URL } from "@siteage/shared";

const SITE_URL = "https://siteage.org";

const staticPages = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/about", priority: "0.5", changefreq: "monthly" },
  { url: "/browse", priority: "0.8", changefreq: "daily" },
  { url: "/why-verify", priority: "0.7", changefreq: "monthly" },
  { url: "/integrate", priority: "0.6", changefreq: "monthly" },
  { url: "/docs", priority: "0.6", changefreq: "monthly" },
  { url: "/stats", priority: "0.7", changefreq: "weekly" },
];

export const GET: APIRoute = async () => {
  const apiBase = import.meta.env.PUBLIC_API_URL || API_BASE_URL;

  let domainEntries: { domain: string; updated_at?: string }[] = [];

  try {
    const resp = await fetch(`${apiBase}/sitemap-domains`);
    if (resp.ok) {
      const data = (await resp.json()) as {
        domains: { domain: string; updated_at?: string }[];
      };
      domainEntries = data.domains || [];
    }
  } catch {
    // Fallback: still return static pages
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
${domainEntries
  .map(
    (d) => `  <url>
    <loc>${SITE_URL}/${d.domain}</loc>${d.updated_at ? `\n    <lastmod>${d.updated_at.split("T")[0]}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, max-age=600",
    },
  });
};
