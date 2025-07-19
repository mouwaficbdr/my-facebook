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

const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/default-avatar.png',
  onError,
  onLoad,
  objectFit = 'cover',
  onClick,
  style,
  ...otherProps
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImgSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    const imageUrl = getMediaUrl(src);
    setImgSrc(imageUrl);
    setHasError(false);
    setIsLoading(true);
  }, [src, fallbackSrc]);

  const handleError = (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Image failed to load: ${imgSrc}`);
    setHasError(true);
    setImgSrc(fallbackSrc);
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
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ objectFit }}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        loading="lazy"
        {...otherProps}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <span className="text-gray-400 text-xs">Image non disponible</span>
        </div>
      )}
    </div>
  );
};

export default ImageLoader;
