// TODO: Centraliser tous les appels API d'authentification ici (signup, login, confirm, reset, logout)
// Exemples :
// - export async function login(email, password) { ... }
// - export async function signup(data) { ... }
// - etc.

export async function login(email: string, password: string) {
  const res = await fetch('/api/login.php', {
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
