import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

/**
 * Composant Spinner : loader léger pour les chargements localisés
 * - Tailles disponibles : small (16px), medium (24px), large (32px)
 * - Couleurs disponibles : primary (bleu), secondary (gris), white (blanc)
 * - Entièrement personnalisable via className
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
}) => {
  // Définition des tailles
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  // Définition des couleurs
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Chargement en cours"
    >
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

export default Spinner;
