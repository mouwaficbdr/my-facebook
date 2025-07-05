import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logout as logoutAPI } from '../api/auth';
import ModernToastContainer from '../components/ModernToast';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Loading';
import logo from '../assets/facebook-blue-logo-full.png';
import { LogOut, User, Mail, Calendar, Users } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAPI();
      success('Déconnexion réussie !');
      setTimeout(() => {
        logout();
      }, 1000);
    } catch (err: any) {
      error(err?.message || 'Erreur lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return <Loading />;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <ModernToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-8 w-auto"
                style={{ filter: 'drop-shadow(0 0 16px #3b82f6aa)' }}
              />
            </div>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Déconnexion...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue, {user.prenom} ! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Voici vos informations de profil
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                {user.photo_profil ? (
                  <img
                    src={user.photo_profil}
                    alt="Photo de profil"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {user.prenom} {user.nom}
              </h2>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-center md:justify-start text-gray-600">
                  <Mail className="w-5 h-5 mr-3 text-blue-500" />
                  <span className="font-medium">{user.email}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-blue-500" />
                  <span className="font-medium">{user.genre}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                  <span className="font-medium">
                    Né(e) le {formatDate(user.date_naissance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-gray-600">Amis</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">0</div>
            <div className="text-gray-600">Publications</div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
            <div className="text-gray-600">Messages</div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Félicitations !
          </h3>
          <p className="text-gray-700 mb-6">
            Votre compte a été créé avec succès. Vous êtes maintenant connecté à MyFacebook.
          </p>
          <div className="text-sm text-gray-500">
            Cette page sera bientôt enrichie avec plus de fonctionnalités comme le flux d'actualités, 
            la gestion des amis, et bien plus encore !
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} MyFacebook. Un projet inspiré, pas affilié à Meta.
          </div>
        </div>
      </footer>
    </div>
  );
} 