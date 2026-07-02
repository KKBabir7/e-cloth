/**
 * robots.txt for CustomWear BD
 * 
 * Next.js App Router automatically serves this at /robots.txt
 * This tells search engine crawlers what they can and cannot access.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://customwear.bd';

export default function robots() {
  return {
    rules: [
      {
        // Allow all major search engine bots
        userAgent: '*',
        allow: '/',
        // Block admin panel from being indexed
        disallow: [
          '/admincloth/',
          '/account/',
          '/cart',
          '/checkout',
          '/api/',
        ],
      },
    ],
    // Point to our sitemap
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
