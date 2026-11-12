import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * SEO files that need the live address. Set SITE_URL (e.g. in .env.local or
 * the host's environment: SITE_URL=https://your-domain.com) and the build:
 * - makes og:image / twitter:image / og:url absolute and adds a canonical link
 * - writes robots.txt and sitemap.xml with the three public pages
 * Without SITE_URL the build still works, with relative preview URLs and no
 * sitemap. The secret sign-in and admin pages are never listed anywhere.
 */
function seo(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, "");
  const pages = ["/", "/about", "/projects"];
  return {
    name: "portfolio-seo",
    transformIndexHtml(html) {
      if (!base) return html;
      return html
        .replace(/(property="og:url" content=")\//, `$1${base}/`)
        .replace(/(content=")\/og\.png"/g, `$1${base}/og.png"`)
        .replace("</title>", `</title>\n    <link rel="canonical" href="${base}/" />`);
    },
    generateBundle() {
      const robots = base ? `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n` : "User-agent: *\nAllow: /\n";
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
      if (!base) return;
      const urls = pages.map((p) => `  <url><loc>${base}${p === "/" ? "/" : p}</loc></url>`).join("\n");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  // "" prefix: also reads SITE_URL from the shell or the host's environment
  plugins: [react(), seo(loadEnv(mode, ".", "").SITE_URL || "")],
  server: {
    // Listen on IPv4 and IPv6 so http://localhost works in every browser
    // (by default Vite may bind only to ::1 on Windows).
    host: true,
    port: 5173,
  },
}));
