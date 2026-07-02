import React, { Suspense } from 'react';
import ShopClient from './ShopClient';
import { getBackendUrl } from '@/utils/api';
import BrandLoader from '../../components/BrandLoader';

export const metadata = {
  title: "Shop Premium Apparel Catalog | CustomWear BD",
  description: "Browse Bangladesh's premium apparel collections. High quality custom T-shirts, Polo shirts, Punjabi, and fashion wear with home delivery."
};

// Fetch categories on the server
async function fetchCategories() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/categories`, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    return data.success ? data.categories : [];
  } catch (err) {
    console.warn('SSR Shop categories fetch failed. Running with fallback.');
    return [];
  }
}

// Fetch products on the server matching the URL filters and current page
async function fetchProductsForPage(searchParams) {
  const page = parseInt(searchParams.page || '1', 10);
  const category = searchParams.category || '';
  const search = searchParams.search || '';
  const sort = searchParams.sort || 'newest';
  const availability = searchParams.availability || '';
  const maxPrice = searchParams.maxPrice || '';
  const size = searchParams.size || '';

  let query = `${getBackendUrl()}/api/products?page=${page}&limit=6&sort=${sort}`;
  if (category) query += `&category=${category}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (availability) query += `&availability=${availability}`;
  if (maxPrice) query += `&maxPrice=${maxPrice}`;
  if (size) query += `&size=${size}`;

  try {
    const res = await fetch(query, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    
    return {
      products: data.success ? data.products : [],
      totalPages: data.success ? data.pages : 1,
      totalProducts: data.success ? data.total : 0,
      priceBounds: data.success ? (data.priceBounds || { min: 0, max: 5000 }) : { min: 0, max: 5000 },
      page: page,
    };
  } catch (err) {
    console.warn(`SSR Shop products page ${page} fetch failed. Running with fallback.`);
    return {
      products: [],
      totalPages: 1,
      totalProducts: 0,
      priceBounds: { min: 0, max: 5000 },
      page: page,
    };
  }
}

// SSR wrapper page to fetch initial load data on server side
export default async function ShopPage({ searchParams }) {
  const resolvedSearchParams = await searchParams || {}; // Next.js 14 searchParams resolved dynamically
  
  const [categoriesData, productsData] = await Promise.all([
    fetchCategories(),
    fetchProductsForPage(resolvedSearchParams)
  ]);

  return (
    <Suspense fallback={<BrandLoader fullPage={true} transparent={false} />}>
      <ShopClient 
        initialProductsData={productsData}
        initialCategoriesData={categoriesData}
      />
    </Suspense>
  );
}
