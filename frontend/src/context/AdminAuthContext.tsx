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
        // Vérifier d'abord si on a un utilisateur en localStorage
        const savedUser = localStorage.getItem('admin_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Ensuite vérifier avec l'API
        try {
          const adminModule = await import('../api/admin');
          const response = await adminModule.checkAdminAuth();

          if (response && response.user) {
            setUser(response.user);
            localStorage.setItem('admin_user', JSON.stringify(response.user));
          } else {
            setUser(null);
            localStorage.removeItem('admin_user');
          }
        } catch (apiError) {
          // Si l'API échoue avec une erreur 401/403, on déconnecte
          if (
            apiError &&
            typeof apiError === 'object' &&
            'status' in apiError &&
            [401, 403].includes((apiError as any).status)
          ) {
            setUser(null);
            localStorage.removeItem('admin_user');
          } else if (!savedUser) {
            // Si c'est une autre erreur (réseau par exemple) et qu'on n'a pas d'utilisateur en cache,
            // on déconnecte aussi
            setUser(null);
            localStorage.removeItem('admin_user');
          }
          // Sinon, on garde l'utilisateur du localStorage pour éviter les déconnexions
          // en cas de problème réseau temporaire
        }
      } catch (error) {
        // Suppression du console.error de debug
        // Ne pas rediriger automatiquement pour éviter les boucles infinies
        setUser(null);
        localStorage.removeItem('admin_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: AdminUser) => {
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    // Attendre un court instant pour laisser le temps au cookie d'être enregistré
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 100);
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
    navigate('/admin-login');
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
