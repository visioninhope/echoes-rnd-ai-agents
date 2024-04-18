import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '', // No path is disallowed
    },
    sitemap: 'https://acme.com/sitemap.xml',
  }
}