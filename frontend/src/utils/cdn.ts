// Utilitaire pour générer l'URL absolue d'un média stocké côté backend

export function getMediaUrl(path?: string | null): string {
  if (!path) return '/default-avatar.png';

  // Si c'est déjà une URL complète, la retourner
  if (path.startsWith('http')) return path;

  // Ajoute un / devant si manquant
  if (!path.startsWith('/')) path = '/' + path;

  // En production, utiliser l'URL de l'API backend
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  // Construire l'URL complète
  const fullUrl = `${base}${path}`;

  return fullUrl;
}

// Fonction pour vérifier si une image existe
export async function imageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Fonction pour obtenir l'URL avec fallback
export async function getMediaUrlWithFallback(
  path?: string | null,
  fallback: string = '/default-avatar.png'
): Promise<string> {
  if (!path) return fallback;

  const url = getMediaUrl(path);
  const exists = await imageExists(url);

  return exists ? url : fallback;
}
