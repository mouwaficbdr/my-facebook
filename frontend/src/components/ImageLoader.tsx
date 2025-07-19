import { useState, useEffect, useRef } from 'react';
import Spinner from './Spinner';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  spinnerSize?: 'small' | 'medium' | 'large';
  spinnerColor?: 'primary' | 'secondary' | 'white';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
  [key: string]: any; // Pour accepter d'autres props HTML
}

/**
 * Composant ImageLoader : affiche un spinner pendant le chargement des images
 * - Utilise le composant Spinner pour indiquer le chargement
 * - Transition fluide entre le spinner et l'image
 * - Gestion des erreurs de chargement
 */
const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  alt,
  className = '',
  spinnerSize = 'medium',
  spinnerColor = 'primary',
  objectFit = 'cover',
  onLoad,
  onError,
  onClick,
  style,
  ...otherProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);
  const currentSrcRef = useRef(src);

  useEffect(() => {
    // Si la source n'a pas changé, ne rien faire
    if (currentSrcRef.current === src && imageSrc) {
      return;
    }

    // Mettre à jour la référence
    currentSrcRef.current = src;

    // Réinitialiser l'état
    setIsLoading(true);
    setHasError(false);

    // Précharger l'image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      // Vérifier si la source est toujours la même
      if (currentSrcRef.current === src) {
        setImageSrc(src);
        setIsLoading(false);
        if (onLoad) onLoad();
      }
    };

    img.onerror = (e) => {
      if (currentSrcRef.current === src) {
        setIsLoading(false);
        setHasError(true);
        if (onError) {
          const event = e as unknown as React.SyntheticEvent<
            HTMLImageElement,
            Event
          >;
          onError(event);
        }
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError, imageSrc]);

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Spinner de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <Spinner size={spinnerSize} color={spinnerColor} />
        </div>
      )}

      {/* Image avec transition */}
      <img
        ref={imageRef}
        src={hasError ? '/default-image.png' : imageSrc || src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className.includes('rounded-full') ? 'rounded-full' : ''}`}
        style={{ objectFit }}
        onClick={onClick}
        onError={(e) => {
          setHasError(true);
          if (onError) onError(e);
        }}
        {...otherProps}
      />
    </div>
  );
};

export default ImageLoader;
