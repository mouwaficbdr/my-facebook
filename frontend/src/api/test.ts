import { API_BASE } from './base';

/**
 * Teste l'authentification en vérifiant si le cookie JWT est correctement envoyé
 * @returns Informations sur l'authentification
 */
export async function testAuth() {
  try {
    const res = await fetch(`${API_BASE}/api/test_auth.php`, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Erreur HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    // Suppression du console.error de debug
    throw err;
  }
}
