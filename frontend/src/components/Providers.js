'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { UIProvider } from '../context/UIContext';
import { loadUser } from '../store/authSlice';
import { fetchCart } from '../store/cartSlice';
import { fetchWishlist } from '../store/wishlistSlice';
import { getBackendUrl } from '../utils/api';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 30, // 30 min in-memory cache
      staleTime: 1000 * 60 * 2, // 2 min fresh
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

/**
 * GlobalRealtimeSync — must be rendered INSIDE PersistQueryClientProvider.
 * Opens ONE EventSource to /api/events. Backend broadcasts when any admin
 * mutation happens (products/categories/hero-slides). We invalidate the
 * matching React Query cache key → all subscribed components refetch instantly.
 * Zero polling. Zero timers.
 */
function GlobalRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    // EventSource is browser-only — safe because useEffect never runs on server
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl();

    let es;
    try {
      es = new EventSource(`${BACKEND}/api/events`);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SSE] Failed to initialize EventSource:', err);
      }
      return; // SSR or non-browser env — bail silently
    }

    const connectedHandler = () => {};
    es.addEventListener('connected', connectedHandler);

    const handler = (e) => {
      try {
        const { type } = JSON.parse(e.data);
        switch (type) {
          case 'categories':
            qc.invalidateQueries({ queryKey: ['categories'] });
            break;
          case 'hero-slides':
            qc.invalidateQueries({ queryKey: ['heroSlides'] });
            break;
          case 'products':
            qc.invalidateQueries({ queryKey: ['products'] });
            qc.invalidateQueries({ queryKey: ['product'] });
            break;
          case 'orders':
            qc.invalidateQueries({ queryKey: ['orders'] });
            break;
          default:
            break;
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[SSE] Error handling update event:', err);
        }
      }
    };

    es.addEventListener('update', handler);
    es.onerror = () => {};

    return () => {
      es.removeEventListener('connected', connectedHandler);
      es.removeEventListener('update', handler);
      es.close();
    };
  }, [qc]);

  return null;
}

export default function Providers({ children }) {
  useEffect(() => {
    store.dispatch(loadUser());

    const scheduleDeferredPrefetch = () => {
      store.dispatch(fetchCart());
      store.dispatch(fetchWishlist());
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(scheduleDeferredPrefetch, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = setTimeout(scheduleDeferredPrefetch, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <UIProvider>
          <GlobalRealtimeSync />
          {children}
        </UIProvider>
      </QueryClientProvider>
    </Provider>
  );
}
