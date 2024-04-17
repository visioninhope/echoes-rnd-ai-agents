import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const sitemap = "https://acme.com/sitemap.xml"

  console.log("sitemap", sitemap);
  return {
    rules: {
      userAgent: "*",
      allow:"*", // Allow crawling by any bot
    },
    sitemap: 'https://acme.com/sitemap.xml',
  };
}
