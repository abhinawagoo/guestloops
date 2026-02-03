import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://guestloops.com";

/**
 * robots.txt for search engines and AI crawlers.
 * Allows indexing of public pages; disallows admin, API, and auth callbacks.
 * Explicit allow for common AI crawlers so the site can appear in LLM/AI search.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/superadmin",
          "/superadmin/",
        ],
      },
      // AI / LLM crawlers: allow so GuestLoops can be discovered in AI search and citations
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
      { userAgent: "anthropic-ai", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
      { userAgent: "Applebot-Extended", allow: "/", disallow: ["/admin", "/admin/", "/api/", "/auth/", "/superadmin", "/superadmin/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
