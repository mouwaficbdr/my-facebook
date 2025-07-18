import { API_BASE } from './base';

// Types pour les stories
export interface StoryView {
  id: number;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  viewed_at: string;
}

export interface Story {
  id: number;
  user_id: number;
  user_nom: string;
  user_prenom: string;
  user_avatar: string | null;
  image: string;
  legend: string | null;
  created_at: string;
  view_count: number;
  viewed_by_me?: boolean;
}

export interface UserStories {
  user_id: number;
  user_nom: string;
  user_prenom: string;
  user_avatar: string | null;
  stories: Story[];
}

/**
 * Récupère toutes les stories actives (moins de 24h)
 * @param friendsOnly Si true, ne récupère que les stories des amis
 * @returns Liste des stories groupées par utilisateur
 */
export async function fetchStories(
  friendsOnly: boolean = false
): Promise<UserStories[]> {
  try {
    const url = friendsOnly
      ? `${API_BASE}/api/stories.php?friends=true`
      : `${API_BASE}/api/stories.php`;

    const res = await fetch(url, {
      credentials: 'include',
    });

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

/**
 * Récupère une story spécifique par son ID
 * @param id ID de la story
 * @returns Détails de la story
 */
export async function fetchStory(id: number): Promise<Story> {
  try {
    const res = await fetch(`${API_BASE}/api/stories.php?id=${id}`, {
      credentials: 'include',
    });

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

    return data.story;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Connexion au serveur impossible. Vérifiez votre connexion ou réessayez plus tard.'
      );
    }
    throw err;
  }
}

/**
 * Récupère les vues d'une story
 * @param id ID de la story
 * @returns Liste des utilisateurs ayant vu la story
 */
export async function fetchStoryViews(
  id: number
): Promise<{ views: StoryView[]; count: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/stories.php?id=${id}&vues`, {
      credentials: 'include',
    });

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

    return {
      views: data.views,
      count: data.count,
    };
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Connexion au serveur impossible. Vérifiez votre connexion ou réessayez plus tard.'
      );
    }
    throw err;
  }
}

/**
 * Crée une nouvelle story
 * @param formData FormData contenant l'image et la légende
 * @returns La story créée
 */
export async function createStory(formData: FormData): Promise<Story> {
  try {
    // S'assurer que les cookies sont envoyés avec la requête
    const res = await fetch(`${API_BASE}/api/stories.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        // Ne pas définir Content-Type car FormData le fait automatiquement avec la boundary
      },
    });

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

    return data.story;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Connexion au serveur impossible. Vérifiez votre connexion ou réessayez plus tard.'
      );
    }
    throw err;
  }
}

/**
 * Supprime une story
 * @param id ID de la story à supprimer
 * @returns Message de confirmation
 */
export async function deleteStory(id: number): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/stories.php?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

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

    return data.message;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Connexion au serveur impossible. Vérifiez votre connexion ou réessayez plus tard.'
      );
    }
    throw err;
  }
}
