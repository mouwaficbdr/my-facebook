import React from 'react';
import Spinner from './Spinner';

interface LoadingSectionProps {
  message?: string;
  className?: string;
  spinnerSize?: 'small' | 'medium' | 'large';
  spinnerColor?: 'primary' | 'secondary' | 'white';
}

/**
 * Composant LoadingSection : loader léger pour les sections spécifiques
 * - Affiche un spinner avec un message optionnel
 * - Idéal pour les chargements localisés (sections, listes, etc.)
 * - Entièrement personnalisable via className
 */
const LoadingSection: React.FC<LoadingSectionProps> = ({
  message,
  className = '',
  spinnerSize = 'medium',
  spinnerColor = 'primary',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-4 ${className}`}
    >
      <Spinner size={spinnerSize} color={spinnerColor} />
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSection;
