import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const sitemap = "https://acme.com/sitemap.xml";

  console.log("sitemap", sitemap);
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/dashboard/[slug]/chat/[chatid]",
        "/dashboard/testtest/chat/3918",
      ],
    },
    sitemap: "https://acme.com/sitemap.xml",
  };
}
