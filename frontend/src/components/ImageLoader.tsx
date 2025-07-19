import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../utils/cdn';

interface ImageLoaderProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: (e?: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: () => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  spinnerSize?: 'small' | 'medium' | 'large';
  spinnerColor?: 'primary' | 'secondary' | 'white';
  onClick?: () => void;
  style?: React.CSSProperties;
  [key: string]: any; // Pour accepter d'autres props HTML
}

const DEFAULT_PLACEHOLDER = '/default-avatar.png';

const getValidImgSrc = (
  src: string | null | undefined,
  fallback: string | null | undefined
): string | undefined => {
  if (src && src.trim() !== '') return getMediaUrl(src);
  if (fallback && fallback.trim() !== '') return fallback;
  return DEFAULT_PLACEHOLDER;
};

const ImageLoader: React.FC<ImageLoaderProps> = (props) => {
  const {
    src,
    alt,
    className = '',
    fallbackSrc = '/default-avatar.png',
    onError,
    onLoad,
    objectFit = 'cover',
    onClick,
    style,
    spinnerSize, // on l'exclut du DOM
    spinnerColor, // on l'exclut du DOM
    ...otherProps
  } = props;

  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validSrc = getValidImgSrc(src, fallbackSrc);
    setImgSrc(validSrc);
    setHasError(false);
    setIsLoading(false);
  }, [src, fallbackSrc]);

  const handleError = (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Image failed to load: ${imgSrc}`);
    setHasError(true);
    const fallback = getValidImgSrc(undefined, fallbackSrc);
    setImgSrc(fallback);
    setIsLoading(false);
    onError?.(e);
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      {imgSrc && imgSrc.trim() !== '' && !hasError && (
        <img
          src={imgSrc}
          alt={alt}
          className={`${className} ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          style={{ objectFit }}
          onError={handleError}
          onLoad={handleLoad}
          onClick={onClick}
          loading="lazy"
          {...otherProps}
        />
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <span className="text-gray-400 text-xs">Image non disponible</span>
        </div>
      )}
    </div>
  );
};

export default ImageLoader;
