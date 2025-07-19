import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/cdn';
import { useState } from 'react';
import ImageLoader from './ImageLoader';

interface AvatarProps {
  userId?: number;
  prenom: string;
  nom: string;
  photo?: string | null;
  size?: number; // en px, défaut 40
  className?: string;
  onClick?: () => void;
  [key: string]: any; // Pour accepter d'autres props HTML
}

export default function Avatar({
  userId,
  prenom,
  nom,
  photo,
  size = 40,
  className = '',
  onClick,
  ...otherProps
}: AvatarProps) {
  const { user } = useAuth();
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  // Si c'est l'utilisateur connecté, on force la photo du contexte
  const isCurrentUser = userId && user && userId === user.id;
  const displayPhoto = isCurrentUser ? user?.photo_profil : photo;
  const displayUrl = displayPhoto ? getMediaUrl(displayPhoto) : undefined;
  const [imgError, setImgError] = useState(false);

  if (displayUrl && !imgError) {
    return (
      <ImageLoader
        src={displayUrl}
        alt={`${prenom} ${nom}`}
        className={`rounded-full ${className}`}
        objectFit="cover"
        spinnerSize="small"
        spinnerColor="primary"
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        onClick={onClick}
        {...otherProps}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-label={initials}
      onClick={onClick}
      {...otherProps}
    >
      {initials}
    </div>
  );
}
