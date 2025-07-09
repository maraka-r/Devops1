'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, Truck, Construction } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackIcon?: 'package' | 'truck' | 'construction';
  size?: 'default' | 'small';
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName,
  fill = false,
  width,
  height,
  priority = false,
  sizes,
  quality,
  placeholder,
  blurDataURL,
  fallbackIcon = 'construction',
  size = 'default',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const FallbackIcon = fallbackIcon === 'truck' ? Truck : fallbackIcon === 'construction' ? Construction : Package;
  const isSmall = size === 'small';
  const iconSize = isSmall ? 'h-6 w-6' : 'h-12 w-12';
  const loadingIconSize = isSmall ? 'h-4 w-4' : 'h-8 w-8';

  // Si pas d'src ou erreur de chargement, afficher le fallback
  if (!src || hasError) {
    return (
      <div className={cn(
        "w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center rounded-s-xl",
        fallbackClassName
      )}>
        <div className={cn("text-slate-400 text-center", isSmall ? "p-2" : "p-4")}>
          <FallbackIcon className={cn(iconSize, "mx-auto text-slate-300")} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Skeleton pendant le chargement */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse flex items-center justify-center rounded-lg">
          <div className="text-slate-400 text-center">
            <FallbackIcon className={cn(loadingIconSize, "mx-auto animate-pulse text-slate-300")} />
          </div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        priority={priority}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
