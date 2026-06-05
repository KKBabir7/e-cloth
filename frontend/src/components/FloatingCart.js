'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IoBagHandle } from 'react-icons/io5';

export default function FloatingCart() {
  const router = useRouter();
  const { items } = useSelector((state) => state.cart);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const cartCount = items.length;

  if (cartCount === 0) return null; // Only display when there are items in the basket

  return (
    <button
      onClick={() => router.push('/cart')}
      className="floating-cart-trigger"
      aria-label="View Shopping Cart"
    >
      <IoBagHandle size={24} />
      <span className="floating-cart-badge">{cartCount}</span>
    </button>
  );
}
