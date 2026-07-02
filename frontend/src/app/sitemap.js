/**
 * Dynamic XML Sitemap for CustomWear BD
 * 
 * Next.js App Router automatically serves this at /sitemap.xml
 * Google, Bing, and other search engines use this to discover all pages.
 *
 * This sitemap includes:
 *  - Static pages (Home, Shop, About, Contact, etc.)
 *  - Every product page (fetched from the API)
 *  - Every category filter page
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://customwear.bd';

// Fetch all products for sitemap
async function getAllProducts() {
  try {
    let allProducts = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const res = await fetch(
        `${BACKEND_URL}/api/products?page=${page}&limit=${limit}&sort=newest`,
        { next: { revalidate: 3600 } } // re-generate sitemap every hour
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!data.success || !data.products || data.products.length === 0) break;

      allProducts = [...allProducts, ...data.products];
      if (page >= data.pages) break;
      page++;
    }
    return allProducts;
  } catch (err) {
    console.warn('Sitemap: Could not fetch products from API.', err.message);
    return [];
  }
}

// Fetch all categories for sitemap
async function getAllCategories() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.categories : [];
  } catch (err) {
    console.warn('Sitemap: Could not fetch categories from API.', err.message);
    return [];
  }
}

export default async function sitemap() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  // ── Static pages ────────────────────────────────────────────────────────
  const staticPages = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/design`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // ── Category filter pages (e.g. /shop?category=t-shirts) ────────────────
  const categoryPages = categories.map((cat) => ({
    url: `${SITE_URL}/shop?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // ── Individual product pages ─────────────────────────────────────────────
  // Use slug if available, fall back to _id — both work with our product page
  const productPages = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug || product._id}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
