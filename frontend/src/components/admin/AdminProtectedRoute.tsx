import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import Loading from '../Loading';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AdminProtectedRoute({
  children,
  requireAdmin = false,
}: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, canAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/admin-login');
      } else if (requireAdmin && !canAdmin()) {
        // Rediriger vers le dashboard si l'utilisateur n'est pas admin mais est modérateur
        navigate('/admin/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, requireAdmin, canAdmin, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && !canAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès restreint
          </h2>
          <p className="text-gray-600">
            Cette section est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
