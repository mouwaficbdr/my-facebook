// API calls for admin back office

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/admin/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur de connexion';
    throw new Error(error);
  }
  return data;
}

export async function adminLogout() {
  const res = await fetch(`${API_BASE}/api/admin/logout.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur de déconnexion';
    throw new Error(error);
  }
  return data;
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/api/admin/stats.php`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors du chargement des statistiques';
    throw new Error(error);
  }
  return data.data;
}

export async function fetchUsers(page = 1, limit = 20, search = '', role = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && { role }),
  });

  const res = await fetch(`${API_BASE}/api/admin/users.php?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors du chargement des utilisateurs';
    throw new Error(error);
  }
  return data.data;
}

export async function updateUser(
  userId: number,
  updates: { role?: string; is_active?: boolean }
) {
  const res = await fetch(`${API_BASE}/api/admin/users.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id: userId, ...updates }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors de la modification';
    throw new Error(error);
  }
  return data;
}

export async function deleteUser(userId: number) {
  const res = await fetch(`${API_BASE}/api/admin/users.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors de la suppression';
    throw new Error(error);
  }
  return data;
}

export async function fetchPosts(
  page = 1,
  limit = 20,
  search = '',
  userId = 0
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(userId > 0 && { user_id: userId.toString() }),
  });

  const res = await fetch(`${API_BASE}/api/admin/posts.php?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors du chargement des posts';
    throw new Error(error);
  }
  return data.data;
}

export async function deletePost(
  postId: number,
  reason = 'Modération administrative'
) {
  const res = await fetch(`${API_BASE}/api/admin/posts.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ post_id: postId, reason }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors de la suppression';
    throw new Error(error);
  }
  return data;
}

export async function fetchModerationLogs(
  page = 1,
  limit = 20,
  actionType = ''
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(actionType && { action_type: actionType }),
  });

  const res = await fetch(
    `${API_BASE}/api/admin/moderation_logs.php?${params}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur lors du chargement des logs';
    throw new Error(error);
  }
  return data.data;
}
