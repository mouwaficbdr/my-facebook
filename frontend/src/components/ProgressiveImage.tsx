import { useState, useEffect, useRef } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: () => void;
}

export default function ProgressiveImage({
  src,
  alt,
  className = '',
  placeholderColor = '#f3f4f6',
  onError,
  onLoad,
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState('');
  const [error, setError] = useState(false);

  // Utiliser une référence pour suivre la source actuelle
  // Cela évite les problèmes de course condition lors du chargement de plusieurs images
  const currentSrcRef = useRef(src);

  useEffect(() => {
    // Si la source n'a pas changé, ne rien faire
    if (currentSrcRef.current === src && currentSrc) {
      return;
    }

    // Mettre à jour la référence
    currentSrcRef.current = src;

    // Réinitialiser l'état de chargement lorsque la source change
    setIsLoading(true);
    setError(false);

    // Précharger l'image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      // Vérifier si la source est toujours la même
      if (currentSrcRef.current === src) {
        setCurrentSrc(src);
        setIsLoading(false);
        // Notifier le parent que l'image est chargée
        if (onLoad) {
          onLoad();
        }
      }
    };

    img.onerror = () => {
      if (currentSrcRef.current === src) {
        setIsLoading(false);
        setError(true);
        if (onError) {
          const event = { target: img } as unknown as React.SyntheticEvent<
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
  }, [src, onError]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder coloré pendant le chargement */}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}

      {/* Image réelle avec transition de fondu */}
      <img
        src={error ? '/default-image.png' : currentSrc || src}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={onError}
        loading="eager"
        decoding="async"
        style={{
          visibility: currentSrc || !isLoading ? 'visible' : 'hidden',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
