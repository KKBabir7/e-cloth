import React from 'react';
import HomeClient from './HomeClient';
import { getBackendUrl } from '@/utils/api';

export const metadata = {
  title: "CustomWear BD | Premium Custom T-Shirts & Fashion Ecommerce",
  description: "Bangladesh's ultimate interactive fashion ecommerce and custom T-shirt customizer. Order via bKash, Nagad, or Cash on Delivery with lightning-fast delivery."
};

// SSR Data Fetching with revalidation intervals and error fallbacks
async function fetchTrendingProducts() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/products?limit=8&sort=popular`, { 
      next: { revalidate: 60 } // Cache and revalidate every 60 seconds
    });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    return data.success ? data.products : [];
  } catch (err) {
    console.warn('SSR Trending products fetch failed. Running with fallback.');
    return [];
  }
}

async function fetchNewArrivals() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/products?limit=8&sort=newest`, { 
      next: { revalidate: 60 }
    });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    return data.success ? data.products : [];
  } catch (err) {
    console.warn('SSR New arrivals fetch failed. Running with fallback.');
    return [];
  }
}

async function fetchHeroSlides() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/hero-slides`, { 
      next: { revalidate: 600 } // Cache slides for 10 minutes
    });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    return data.success ? data.slides : [];
  } catch (err) {
    console.warn('SSR Hero slides fetch failed. Running with fallback.');
    return [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/categories`, { 
      next: { revalidate: 600 }
    });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    return data.success ? data.categories : [];
  } catch (err) {
    console.warn('SSR Categories fetch failed. Running with fallback.');
    return [];
  }
}

export default async function HomePage() {
  // Fetch all layout-essential datasets concurrently during SSR
  const [products, newArrivals, slides, categories] = await Promise.all([
    fetchTrendingProducts(),
    fetchNewArrivals(),
    fetchHeroSlides(),
    fetchCategories()
  ]);

  return (
    <HomeClient 
      initialProducts={products}
      initialNewArrivals={newArrivals}
      initialSlides={slides}
      initialCategories={categories}
    />
  );
}
