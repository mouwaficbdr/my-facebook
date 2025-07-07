interface AvatarProps {
  prenom: string;
  nom: string;
  photo?: string | null;
  size?: number; // en px, défaut 40
  className?: string;
}

export default function Avatar({
  prenom,
  nom,
  photo,
  size = 40,
  className = '',
}: AvatarProps) {
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  if (photo) {
    return (
      <img
        src={photo}
        alt={`${prenom} ${nom}`}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-label={initials}
    >
      {initials}
    </div>
  );
}
