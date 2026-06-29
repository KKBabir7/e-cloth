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

export const getColorName = (hex) => {
  if (!hex) return '';
  let h = hex.trim().toLowerCase();
  if (!h.startsWith('#')) h = '#' + h;

  // Standard color maps
  const colorNames = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#ff0000': 'Red',
    '#0000ff': 'Blue',
    '#00ff00': 'Green',
    '#ffff00': 'Yellow',
    '#ffa500': 'Orange',
    '#ff8525': 'Orange',
    '#800080': 'Purple',
    '#000080': 'Navy',
    '#008080': 'Teal',
    '#808080': 'Gray',
    '#a52a2a': 'Brown',
    '#ffc0cb': 'Pink',
    '#ffd700': 'Gold',
    '#c0c0c0': 'Silver',
    '#f5f5dc': 'Beige',
    '#f0f8ff': 'Alice Blue',
    '#faebd7': 'Antique White',
    '#7fffd4': 'Aquamarine',
    '#f0ffff': 'Azure',
    '#ffe4c4': 'Bisque',
    '#ffebcd': 'Blanched Almond',
    '#8a2be2': 'Blue Violet',
    '#5f9ea0': 'Cadet Blue',
    '#d2691e': 'Chocolate',
    '#ff7f50': 'Coral',
    '#6495ed': 'Cornflower Blue',
    '#fff8dc': 'Cornsilk',
    '#dc143c': 'Crimson',
    '#00ffff': 'Cyan',
    '#b8860b': 'Dark Goldenrod',
    '#a9a9a9': 'Dark Gray',
    '#006400': 'Dark Green',
    '#bdb76b': 'Dark Khaki',
    '#8b008b': 'Dark Magenta',
    '#556b2f': 'Dark Olive Green',
    '#ff8c00': 'Dark Orange',
    '#9932cc': 'Dark Orchid',
    '#8b0000': 'Dark Red',
    '#e9967a': 'Dark Salmon',
    '#8fbc8f': 'Dark Sea Green',
    '#483d8b': 'Dark Slate Blue',
    '#2f4f4f': 'Dark Slate Gray',
    '#00ced1': 'Dark Turquoise',
    '#9400d3': 'Dark Violet',
    '#ff1493': 'Deep Pink',
    '#00bfff': 'Deep Sky Blue',
    '#696969': 'Dim Gray',
    '#1e90ff': 'Dodger Blue',
    '#b22222': 'Firebrick',
    '#fffaf0': 'Floral White',
    '#228b22': 'Forest Green',
    '#dcdcdc': 'Gainsboro',
    '#f8f8ff': 'Ghost White',
    '#daa520': 'Goldenrod',
    '#adff2f': 'Green Yellow',
    '#f0fff0': 'Honeydew',
    '#ff69b4': 'Hot Pink',
    '#cd5c5c': 'Indian Red',
    '#4b0082': 'Indigo',
    '#fffff0': 'Ivory',
    '#f0e68c': 'Khaki',
    '#e6e6fa': 'Lavender',
    '#fff0f5': 'Lavender Blush',
    '#7cfc00': 'Lawn Green',
    '#fffacd': 'Lemon Chiffon',
    '#add8e6': 'Light Blue',
    '#f08080': 'Light Coral',
    '#e0ffff': 'Light Cyan',
    '#fafad2': 'Light Goldenrod Yellow',
    '#d3d3d3': 'Light Gray',
    '#90ee90': 'Light Green',
    '#ffb6c1': 'Light Pink',
    '#ffa07a': 'Light Salmon',
    '#20b2aa': 'Light Sea Green',
    '#87cefa': 'Light Sky Blue',
    '#778899': 'Light Slate Gray',
    '#b0c4de': 'Light Steel Blue',
    '#ffffe0': 'Light Yellow',
    '#32cd32': 'Lime',
    '#faf0e6': 'Linen',
    '#ff00ff': 'Magenta',
    '#66cdaa': 'Medium Aquamarine',
    '#0000cd': 'Medium Blue',
    '#ba55d3': 'Medium Orchid',
    '#9370db': 'Medium Purple',
    '#3cb371': 'Medium Sea Green',
    '#7b68ee': 'Medium Slate Blue',
    '#00fa9a': 'Medium Spring Green',
    '#48d1cc': 'Medium Turquoise',
    '#c71585': 'Medium Violet Red',
    '#191970': 'Midnight Blue',
    '#f5fffa': 'Mint Cream',
    '#ffe4e1': 'Misty Rose',
    '#ffe4b5': 'Moccasin',
    '#ffdead': 'Navajo White',
    '#fdf5e6': 'Old Lace',
    '#6b8e23': 'Olive Drab',
    '#ff4500': 'Orange Red',
    '#da70d6': 'Orchid',
    '#eee8aa': 'Pale Goldenrod',
    '#98fb98': 'Pale Green',
    '#afeeee': 'Pale Turquoise',
    '#db7093': 'Pale Violet Red',
    '#ffefd5': 'Papaya Whip',
    '#ffdab9': 'Peach Puff',
    '#cd853f': 'Peru',
    '#b0e0e6': 'Powder Blue',
    '#bc8f8f': 'Rosy Brown',
    '#4169e1': 'Royal Blue',
    '#8b4513': 'Saddle Brown',
    '#fa8072': 'Salmon',
    '#f4a460': 'Sandy Brown',
    '#2e8b57': 'Sea Green',
    '#fff5ee': 'Seashell',
    '#a0522d': 'Sienna',
    '#87ceeb': 'Sky Blue',
    '#6a5acd': 'Slate Blue',
    '#708090': 'Slate Gray',
    '#fffafa': 'Snow',
    '#00ff7f': 'Spring Green',
    '#4682b4': 'Steel Blue',
    '#d2b48c': 'Tan',
    '#d8bfd8': 'Thistle',
    '#ff6347': 'Tomato',
    '#40e0d0': 'Turquoise',
    '#ee82ee': 'Violet',
    '#f5deb3': 'Wheat',
    '#f5f5f5': 'White Smoke',
    '#9acd32': 'Yellow Green'
  };

  if (colorNames[h]) return colorNames[h];

  const hexToRgb = (hexStr) => {
    let clean = hexStr.replace(/^#/, '').toLowerCase();
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    const num = parseInt(clean, 16);
    return isNaN(num) ? null : {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  const targetRgb = hexToRgb(h);
  if (!targetRgb) return hex;

  let minDistance = Infinity;
  let closestColorName = hex;

  for (const [key, name] of Object.entries(colorNames)) {
    const rgb = hexToRgb(key);
    if (!rgb) continue;

    const distance = Math.sqrt(
      Math.pow(targetRgb.r - rgb.r, 2) +
      Math.pow(targetRgb.g - rgb.g, 2) +
      Math.pow(targetRgb.b - rgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColorName = name;
    }
  }

  return closestColorName;
};
