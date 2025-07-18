import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'moderator';
  photo_profil?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: AdminUser) => void;
  logout: () => void;
  canAdmin: () => boolean;
  canModerate: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Vérifier l'authentification admin au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/me.php', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.success && data.admin) {
          setUser(data.admin);
          localStorage.setItem('admin_user', JSON.stringify(data.admin));
        } else {
          setUser(null);
          localStorage.removeItem('admin_user');
          navigate('/admin-login');
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('admin_user');
        navigate('/admin-login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []); // Correction ici : tableau de dépendances vide

  const login = (userData: AdminUser) => {
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    navigate('/admin/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
    // Appeler l'API de déconnexion si nécessaire
    fetch('/api/admin/logout.php', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignorer les erreurs de déconnexion
    });
    navigate('/admin/login');
  };

  const canAdmin = () => {
    return user?.role === 'admin';
  };

  const canModerate = () => {
    return user?.role === 'admin' || user?.role === 'moderator';
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    canAdmin,
    canModerate,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
