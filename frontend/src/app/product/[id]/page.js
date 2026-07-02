import React from 'react';
import ProductDetailsClient from './ProductDetailsClient';
import { getBackendUrl } from '@/utils/api';

// Dynamic SEO Metadata Generation for Product Detail Page
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${getBackendUrl()}/api/products/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Product Details | CustomWear BD' };
    const data = await res.json();
    if (!data.success || !data.product) return { title: 'Product Not Found | CustomWear BD' };
    
    const product = data.product;
    const cleanDesc = product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) : '';
    
    return {
      title: `${product.name} | CustomWear BD`,
      description: cleanDesc || `${product.name} - Premium fashion and custom wear at CustomWear BD.`,
      openGraph: {
        title: `${product.name} | CustomWear BD`,
        description: cleanDesc,
        images: product.images && product.images.length > 0 ? [product.images[0]] : [],
      }
    };
  } catch (err) {
    return {
      title: 'Product Details | CustomWear BD'
    };
  }
}

async function fetchProduct(id) {
  try {
    const res = await fetch(`${getBackendUrl()}/api/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('API return non-ok status');
    const data = await res.json();
    return data.success ? data.product : null;
  } catch (err) {
    console.warn(`SSR single product fetch failed for ID: ${id}`);
    return null;
  }
}

export default async function ProductDetailsPage({ params }) {
  const product = await fetchProduct(params.id);

  return (
    <ProductDetailsClient initialProduct={product} />
  );
}
