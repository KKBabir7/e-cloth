'use client';

import React, { useEffect, useRef } from 'react';
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
 * GlobalRealtimeSync — opens ONE EventSource to /api/events. The backend
 * broadcasts on every mutation (products/categories/hero-slides/orders) and we
 * invalidate the matching React Query keys → all subscribed components refetch
 * instantly. Zero polling.
 *
 * Robustness: a single dropped/missed event would otherwise leave a tab stale
 * until a manual reload (common in dev hot-reload, flaky networks, server
 * restarts, or throttled background tabs). To guarantee eventual consistency we
 * do a FULL resync whenever:
 *   1. the stream (re)connects (after the very first connect), and
 *   2. the tab becomes visible again after being hidden.
 */
function GlobalRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    // EventSource is browser-only — safe because useEffect never runs on server
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl();

    let hasConnectedOnce = false;

    // Refetch every active query in the app — used after any connectivity gap
    // so changes missed while disconnected are picked up without a page reload.
    const resyncAll = () => {
      qc.invalidateQueries({ refetchType: 'active' });
    };

    const invalidateByType = (type) => {
      switch (type) {
        case 'categories':
          qc.invalidateQueries({ queryKey: ['categories'] });
          qc.invalidateQueries({ queryKey: ['adminCategories'] });
          break;
        case 'stickers':
          qc.invalidateQueries({ queryKey: ['stickers'] });
          qc.invalidateQueries({ queryKey: ['adminStickers'] });
          break;
        case 'fabric-colors':
          qc.invalidateQueries({ queryKey: ['fabricColors'] });
          qc.invalidateQueries({ queryKey: ['adminColors'] });
          break;
        case 'hero-slides':
          qc.invalidateQueries({ queryKey: ['heroSlides'] });
          qc.invalidateQueries({ queryKey: ['adminSlides'] });
          break;
        case 'products':
          // refetchType 'all' also refreshes inactive/background detail queries
          qc.invalidateQueries({ queryKey: ['products'], refetchType: 'all' });
          qc.invalidateQueries({ queryKey: ['product'], refetchType: 'all' });
          qc.invalidateQueries({ queryKey: ['trending'], refetchType: 'all' });
          break;
        case 'orders':
          qc.invalidateQueries({ queryKey: ['orders'] });
          break;
        case 'custom-orders':
          qc.invalidateQueries({ queryKey: ['custom-orders'] });
          qc.invalidateQueries({ queryKey: ['designs'] });
          break;
        case 'media':
          qc.invalidateQueries({ queryKey: ['media'] });
          break;
        default:
          // Unknown event type → safest is a full resync
          resyncAll();
          break;
      }
    };

    let es;
    try {
      es = new EventSource(`${BACKEND}/api/events`);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SSE] Failed to initialize EventSource:', err);
      }
      return; // SSR or non-browser env — bail silently
    }

    const connectedHandler = () => {
      // The very first connect needs no resync (data was just fetched). Every
      // subsequent reconnect means we may have missed events while offline.
      if (hasConnectedOnce) {
        resyncAll();
      } else {
        hasConnectedOnce = true;
      }
    };
    es.addEventListener('connected', connectedHandler);

    const handler = (e) => {
      try {
        const { type } = JSON.parse(e.data);
        invalidateByType(type);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[SSE] Error handling update event:', err);
        }
      }
    };
    es.addEventListener('update', handler);

    // Browsers auto-reconnect EventSource on error; nothing to do here.
    es.onerror = () => {};

    // Background tabs can have their SSE stream throttled/suspended. When the
    // user returns, pull the latest state so the UI is never stale.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        resyncAll();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      es.removeEventListener('connected', connectedHandler);
      es.removeEventListener('update', handler);
      es.close();
      document.removeEventListener('visibilitychange', onVisibility);
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
