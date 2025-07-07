const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchStories() {
  try {
    const res = await fetch(`${API_BASE}/api/stories.php`, { credentials: 'include' });
    if (!res.ok) {
      let msg = `Erreur HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data && data.error) msg = data.error;
      } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue');
    }
    return data.stories;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Connexion au serveur impossible. Vérifiez votre connexion ou réessayez plus tard.'
      );
    }
    throw err;
  }
}
