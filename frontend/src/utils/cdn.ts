// Utilitaire pour générer l’URL absolue d’un média stocké côté backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function getMediaUrl(path?: string | null): string {
  if (!path) return '/default-avatar.png';
  if (path.startsWith('http')) return path;
  // Ajoute un / devant si manquant
  if (!path.startsWith('/')) path = '/' + path;
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return `${base}${path}`;
}
