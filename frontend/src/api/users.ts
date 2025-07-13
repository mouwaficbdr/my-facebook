const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchUsers(query: string) {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `${API_BASE}/api/users/search.php?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error('Erreur lors de la recherche utilisateur');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur inconnue');
  return data.users;
}

export async function fetchFriends(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  const res = await fetch(
    `${API_BASE}/api/friends/list.php?id=${userId}&page=${page}&limit=${limit}`,
    {
      credentials: 'include',
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Erreur lors de la récupération des amis');
  }
  return { friends: data.friends, pagination: data.pagination };
}
