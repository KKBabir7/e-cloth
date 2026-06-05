'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { UIProvider } from '../context/UIContext';
import { loadUser } from '../store/authSlice';
import { fetchCart } from '../store/cartSlice';
import { fetchWishlist } from '../store/wishlistSlice';
import { getBackendUrl } from '../utils/api';

import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h
      staleTime: 1000 * 60 * 10,   // 10 min fresh
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const persister = typeof window !== 'undefined'
  ? createSyncStoragePersister({
      storage: window.localStorage,
      key: 'REACT_QUERY_OFFLINE_CACHE',
    })
  : undefined;

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
    console.log(`[SSE] Connecting to real-time events at: ${BACKEND}/api/events`);

    let es;
    try {
      es = new EventSource(`${BACKEND}/api/events`);
    } catch (err) {
      console.error('[SSE] Failed to initialize EventSource:', err);
      return; // SSR or non-browser env — bail silently
    }

    es.addEventListener('connected', (e) => {
      try {
        console.log('[SSE] Connection established successfully:', JSON.parse(e.data));
      } catch (_) {
        console.log('[SSE] Connection established successfully');
      }
    });

    const handler = (e) => {
      try {
        const { type } = JSON.parse(e.data);
        console.log(`[SSE] Received real-time update event: ${type}`);
        switch (type) {
          case 'categories':
            qc.invalidateQueries({ queryKey: ['categories'] });
            break;
          case 'hero-slides':
            qc.invalidateQueries({ queryKey: ['heroSlides'] });
            break;
          case 'products':
            qc.invalidateQueries({ queryKey: ['products'] });
            qc.invalidateQueries({ queryKey: ['trending'] });
            qc.invalidateQueries({ queryKey: ['product'] });
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('[SSE] Error handling update event:', err);
      }
    };

    es.addEventListener('update', handler);
    es.onerror = (err) => {
      console.warn('[SSE] EventSource encountered an error or disconnected. Reconnecting...', err);
    };

    return () => {
      es.removeEventListener('update', handler);
      es.close();
      console.log('[SSE] Closed EventSource connection');
    };
  }, [qc]);

  return null;
}

export default function Providers({ children }) {
  useEffect(() => {
    store.dispatch(loadUser());
    store.dispatch(fetchCart());
    store.dispatch(fetchWishlist());
  }, []);

  return (
    <Provider store={store}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persister ? { persister } : { persister: { persist: () => {}, restore: () => {} } }}
      >
        <UIProvider>
          <GlobalRealtimeSync />
          {children}
        </UIProvider>
      </PersistQueryClientProvider>
    </Provider>
  );
}
