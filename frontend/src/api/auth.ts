// TODO: Centraliser tous les appels API d'authentification ici (signup, login, confirm, reset, logout)
// Exemples :
// - export async function login(email, password) { ... }
// - export async function signup(data) { ... }
// - etc.

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // pour cookie httpOnly
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur inconnue';
    throw new Error(error);
  }
  return data;
}

export async function signup(data: {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  genre: 'Homme' | 'Femme' | 'Autre';
  date_naissance: string;
}) {
  const res = await fetch(`${API_BASE}/api/signup.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    // Peut contenir .errors (object) ou .message (string)
    throw json;
  }
  return json;
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/api/forgot_password.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur inconnue';
    throw new Error(error);
  }
  return data;
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_BASE}/api/reset_password.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    // Peut contenir .errors (object) ou .message (string)
    throw json;
  }
  return json;
}

export async function logout() {
  const res = await fetch(`${API_BASE}/api/logout.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // pour cookie httpOnly
  });
  const data = await res.json();
  if (!res.ok) {
    const error = data?.message || 'Erreur inconnue';
    throw new Error(error);
  }
  return data;
}
