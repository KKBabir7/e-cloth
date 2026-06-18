const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

export const extractImageAccentColor = (img) => {
  if (!img || !img.naturalWidth) return null;

  try {
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 100) continue;

      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];

      if (pr > 235 && pg > 235 && pb > 235) continue;
      if (pr < 20 && pg < 20 && pb < 20) continue;

      r += pr;
      g += pg;
      b += pb;
      count += 1;
    }

    if (!count) return null;
    return rgbToHex(r / count, g / count, b / count);
  } catch {
    return null;
  }
};

export const getCategoryAccentFallback = (category, index = 0) => {
  if (category?.accentColor) return category.accentColor;

  const slugKey = String(category?.slug || '').toLowerCase();
  const slugMap = {
    't-shirt': '#ff8525',
    polo: '#84cc16',
    shirt: '#3b82f6',
    shirts: '#3b82f6',
    panjabi: '#a855f7',
  };

  if (slugMap[slugKey]) return slugMap[slugKey];

  return ['#ff8525', '#22c55e', '#3b82f6', '#a855f7'][index % 4];
};
