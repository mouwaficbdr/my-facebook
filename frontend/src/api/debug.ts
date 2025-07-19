import { API_BASE } from './base';

/**
 * Teste l'authentification en vérifiant si le cookie JWT est correctement envoyé
 * @returns Informations de débogage sur l'authentification
 */
export async function debugAuth() {
  const res = await fetch(`${API_BASE}/api/debug_auth.php`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status}`);
  }

  return await res.json();
}
