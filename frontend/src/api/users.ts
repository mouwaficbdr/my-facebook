const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchUsers(query: string) {
  if (!query || query.length < 2) return [];
  const res = await fetch(`${API_BASE}/api/users/search.php?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Erreur lors de la recherche utilisateur');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur inconnue');
  return data.users;
} 