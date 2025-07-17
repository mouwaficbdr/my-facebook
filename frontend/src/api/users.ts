import { API_BASE } from './base';

export async function fetchUsers(query: string) {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `${API_BASE}/api/users/search.php?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error('Erreur lors de la recherche utilisateur');
  const data = await res.json();
  if (!data.success)
    throw new Error(data.message || data.error || 'Erreur inconnue');
  // Support des deux formats de réponse (ancien et nouveau)
  return data.users || data.data?.users || [];
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

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  const res = await fetch(`${API_BASE}/api/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || 'Erreur lors du changement de mot de passe'
    );
  }
  return data;
}
