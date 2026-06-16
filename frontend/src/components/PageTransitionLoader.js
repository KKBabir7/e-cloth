'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BrandLoader from './BrandLoader';


export default function PageTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only trigger when pathname actually changes
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // Clear any existing timers
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);

    // Start loader
    setVisible(true);
    setProgress(0);

    // Animate progress bar quickly to ~85%
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 85) {
        p = 85;
        clearInterval(progressRef.current);
      }
      setProgress(p);
    }, 80);

    // After a short delay, complete the bar and hide
    timerRef.current = setTimeout(() => {
      clearInterval(progressRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 320);
    }, 500);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [pathname]);

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

