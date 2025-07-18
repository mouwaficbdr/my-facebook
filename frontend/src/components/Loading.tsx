import { useEffect, useState } from 'react';
import logo from '@/assets/facebook-blue-logo-full.png';

interface LoadingProps {
  /**
   * Délai avant l'affichage du loader (en ms)
   * Permet d'éviter les flashs pour les chargements rapides
   */
  delay?: number;
}

/**
 * Composant Loading : loader plein écran pour les transitions de page
 * - Full Tailwind, responsive, accessible
 * - Transition fluide avec délai configurable pour éviter les flashs
 * - À utiliser uniquement pour les chargements de page complète
 */
const Loading: React.FC<LoadingProps> = ({ delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-50 animate-fade-in"
      style={{
        animation: 'fadeIn 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center relative">
        {/* Logo agrandi, sans halo */}
        <img
          src={logo}
          alt="Facebook"
          className="w-32 md:w-44 mb-4 animate-pulse"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.15))' }}
        />
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: '0s' }}
          ></span>
          <span
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.15s' }}
          ></span>
          <span
            className="w-3 h-3 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: '0.3s' }}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
