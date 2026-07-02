'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import BrandLoader from './BrandLoader';


export default function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <PageTransitionLoaderContent />
    </Suspense>
  );
}

function PageTransitionLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const startedRef = useRef(false);

  const clearAllTimers = () => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
  };

  const startLoader = (initial = 8) => {
    clearAllTimers();
    startedRef.current = true;
    setVisible(true);
    setProgress(initial);

    let p = initial;
    progressRef.current = setInterval(() => {
      p += Math.random() * 14 + 4;
      if (p >= 85) {
        p = 85;
        clearInterval(progressRef.current);
      }
      setProgress(p);
    }, 70);
  };

  const currentQuery = searchParams.toString();

  useEffect(() => {
    clearAllTimers();
    startedRef.current = false;
    timerRef.current = setTimeout(() => {
      clearAllTimers();
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 320);
    }, 500);

    return () => {
      clearAllTimers();
    };
  }, [pathname, currentQuery]);

  useEffect(() => {
    const DRAG_THRESHOLD = 10;
    const dragState = { x: 0, y: 0, dragging: false };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragState.x = event.clientX;
      dragState.y = event.clientY;
      dragState.dragging = false;
    };

    const onPointerMove = (event) => {
      const dx = Math.abs(event.clientX - dragState.x);
      const dy = Math.abs(event.clientY - dragState.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        dragState.dragging = true;
      }
    };

    const resetDragState = () => {
      dragState.x = 0;
      dragState.y = 0;
      dragState.dragging = false;
    };

    const onPointerUp = () => {
      window.setTimeout(resetDragState, 80);
    };

    const onClickCapture = (event) => {
      if (dragState.dragging) return;

      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target === '_blank') return;

      const url = new URL(anchor.href, window.location.href);
      const isInternal = url.origin === window.location.origin;
      const isSamePage = (url.pathname + url.search) === (window.location.pathname + window.location.search);
      if (!isInternal || isSamePage) return;

      if (!startedRef.current) {
        startLoader(12);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', onPointerUp, true);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Slim top progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          zIndex: 99999,
          backgroundColor: 'rgba(255, 140, 0, 0.15)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #FF8C00, #FF6B00)',
            borderRadius: '0 3px 3px 0',
            transition: 'width 0.12s ease-out',
            boxShadow: '0 0 10px rgba(255, 140, 0, 0.6), 0 0 4px rgba(255, 140, 0, 0.4)',
          }}
        >
          {/* Glowing tip */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '-2px',
              width: '80px',
              height: '7px',
              background: 'radial-gradient(ellipse at right, rgba(255,200,80,0.9) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      {/* Full-page backdrop with centered brand spinner */}
      <BrandLoader fullPage={true} transparent={true} />
    </>
  );
}

