'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return <div className={`h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
  }

  return (
    <Image
      src={isDark ? '/logo-dark.png' : '/logo-light.png'}
      alt="Patternle"
      width={375}
      height={119}
      className={`h-8 w-auto ${className}`}
      priority
      unoptimized
    />
  );
}
