'use client';

import { useEffect } from 'react';

export default function Fonts() {
  useEffect(() => {
    const fonts = {
      families: {
        heading: "'Manrope', sans-serif",
        subtitle: "'Sora', sans-serif",
        body: "'Inter', sans-serif"
      },
      cssVariables: {
        '--font-heading': "'Manrope', sans-serif",
        '--font-subtitle': "'Sora', sans-serif",
        '--font-body': "'Inter', sans-serif",
        '--font-accent': "'Inter', sans-serif"
      }
    };

    const root = document.documentElement;
    Object.entries(fonts.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    window.JABIYEN_FONTS = fonts;
  }, []);

  return null;
}
