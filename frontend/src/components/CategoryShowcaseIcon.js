'use client';

import { useRef, useCallback } from 'react';
import Image from 'next/image';
import { extractImageAccentColor } from '@/utils/imageColor';

export default function CategoryShowcaseIcon({ src, alt, fallbackAccent }) {
  const wrapRef = useRef(null);

  const applyAccentFromImage = useCallback((img) => {
    const color = extractImageAccentColor(img);
    if (color && wrapRef.current) {
      wrapRef.current.style.setProperty('--cat-accent', color);
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className="category-showcase-icon-wrap"
      style={{ '--cat-accent': fallbackAccent }}
    >
      <Image
        src={src}
        alt={alt}
        width={30}
        height={30}
        unoptimized
        className="category-showcase-icon"
        onLoadingComplete={applyAccentFromImage}
      />
    </div>
  );
}
