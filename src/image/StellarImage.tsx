import React, { ImgHTMLAttributes, useState, useRef, useEffect } from 'react';

export type ImageFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

export interface StellarImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  /** Image source path (relative to public directory) */
  src: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Output format (default: webp) */
  format?: ImageFormat;
  /** Quality 1-100 (default: 80) */
  quality?: number;
  /** Object fit mode */
  fit?: ImageFit;
  /** Blur amount (0-100) */
  blur?: number;
  /** Load immediately without lazy loading */
  priority?: boolean;
  /** Show blur placeholder while loading */
  placeholder?: 'blur' | 'empty';
  /** Blur placeholder data URI */
  blurDataURL?: string;
  /** Image optimization endpoint (default: /__stellar/image) */
  optimizerEndpoint?: string;
  /** Fill parent container */
  fill?: boolean;
  /** Responsive sizes attribute */
  sizes?: string;
}

const buildSrc = (
  src: string,
  opts: {
    width?: number;
    height?: number;
    format?: ImageFormat;
    quality?: number;
    fit?: ImageFit;
    blur?: number;
    endpoint?: string;
  }
): string => {
  const endpoint = opts.endpoint || '/__stellar/image';
  const params = new URLSearchParams({ src });
  if (opts.width) params.set('w', String(opts.width));
  if (opts.height) params.set('h', String(opts.height));
  if (opts.format) params.set('f', opts.format);
  if (opts.quality) params.set('q', String(opts.quality));
  if (opts.fit) params.set('fit', opts.fit);
  if (opts.blur) params.set('blur', String(opts.blur));
  return `${endpoint}?${params.toString()}`;
};

export const StellarImage: React.FC<StellarImageProps> = ({
  src,
  width,
  height,
  alt,
  format = 'webp',
  quality = 80,
  fit = 'inside',
  blur,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  optimizerEndpoint,
  fill = false,
  sizes,
  style,
  className,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = buildSrc(src, {
    width,
    height,
    format,
    quality,
    fit,
    blur,
    endpoint: optimizerEndpoint,
  });

  // Generate blur placeholder src (low quality, small size)
  const placeholderSrc =
    placeholder === 'blur' && blurDataURL
      ? blurDataURL
      : placeholder === 'blur'
      ? buildSrc(src, { width: 20, quality: 20, format: 'jpeg', endpoint: optimizerEndpoint })
      : undefined;

  // Build srcset for responsive images
  const srcSet = width
    ? [0.5, 1, 1.5, 2]
        .map((scale) => {
          const w = Math.round(width * scale);
          return `${buildSrc(src, {
            width: w,
            format,
            quality,
            endpoint: optimizerEndpoint,
          })} ${w}w`;
        })
        .join(', ')
    : undefined;

  useEffect(() => {
    if (imgRef.current?.complete) setIsLoaded(true);
  }, []);

  const containerStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
    : {};

  const imgStyle: React.CSSProperties = {
    ...containerStyle,
    objectFit: fill ? 'cover' : undefined,
    transition: placeholder === 'blur' ? 'filter 0.3s ease' : undefined,
    filter: placeholder === 'blur' && !isLoaded ? 'blur(20px)' : undefined,
    ...style,
  };

  if (hasError) {
    return (
      <div
        style={{
          width,
          height,
          background: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: 12,
        }}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={placeholder === 'blur' && !isLoaded ? placeholderSrc || optimizedSrc : optimizedSrc}
      data-src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes || (width ? `${width}px` : '100vw')}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      style={imgStyle}
      className={className}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};

export default StellarImage;
