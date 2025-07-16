import { Search, Home, MessageCircle, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/facebook-blue-logo-full.png';
import logoMini from '../assets/facebook-logo-mini.png';
import { useNavigate } from 'react-router-dom';
import UserSearchBar from './UserSearchBar';
import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { getMediaUrl } from '../utils/cdn';
import ChangePasswordModal from './ChangePasswordModal';
import NotificationPanel from './NotificationPanel';
import { useToast } from '../hooks/useToast';
import {
  fetchNotifications,
  markNotificationsAsRead,
} from '../api/notifications';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifBadge, setNotifBadge] = useState(0);
  const notifPollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const { success, error } = useToast();

  // Chargement notifications + polling
  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await fetchNotifications(1, 20, true); // n'affiche que les non lues
      setNotifications(data.notifications);
      setNotifBadge(data.notifications.length);
    } catch (e: any) {
      error(e.message || 'Erreur notifications');
    } finally {
      setNotifLoading(false);
    }
  };
  useEffect(() => {
    loadNotifications();
    notifPollingRef.current = setInterval(loadNotifications, 20000);
    return () => {
      if (notifPollingRef.current) clearInterval(notifPollingRef.current);
    };
  }, []);

  // Marquer comme lu
  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationsAsRead([id]);
      setNotifications((prev: any[]) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setNotifBadge((prev) => Math.max(0, prev - 1));
    } catch (e: any) {
      error(e?.message || 'Erreur lors du marquage');
    }
  };

  // Ouvrir/fermer panneau
  const handleNotifClick = () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) loadNotifications();
  };
  // Fermer au clic extérieur
  useEffect(() => {
    if (!notifOpen) return;
    const close = (e: MouseEvent) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen]);

  // Fermer le menu si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full px-2 sm:px-4 md:px-6 mx-auto">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-15">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-full hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Bouton loupe mobile */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-100"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher des utilisateurs"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <button
                className="flex-shrink-0 focus:outline-none"
                aria-label="Accueil Facebook"
                onClick={() => navigate('/home')}
                tabIndex={0}
              >
                {/* Logo responsive : mini sur tablette, full ailleurs */}
                <img
                  src={logo}
                  alt="Logo Facebook"
                  className="h-8 sm:h-12 md:hidden lg:h-16 lg:w-auto w-auto"
                />
                <img
                  src={logoMini}
                  alt="Logo Facebook Mini"
                  className="hidden md:block md:h-10 lg:hidden w-auto"
                />
                <img
                  src={logo}
                  alt="Logo Facebook"
                  className="hidden lg:block h-16 w-auto"
                />
              </button>
            </div>
            {/* Search bar desktop/tablette */}
            <div className="hidden md:block relative max-w-xs">
              <UserSearchBar />
            </div>
          </div>
          {/* Center navigation */}
          {/* TODO: Connecter chaque bouton central à la navigation réelle (Accueil, Amis, Messages, Notifications) */}
          <div
            className="hidden md:flex items-center justify-center space-x-12 h-full absolute left-1/2 -translate-x-1/2 top-0"
            style={{ height: '100%' }}
          >
            <button
              className="h-12 w-12 md:h-10 md:w-10 p-0 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center h-full"
              onClick={() => navigate('/home')}
              aria-label="Accueil"
            >
              <Home className="h-6 w-6" />
            </button>
            <button className="h-12 w-12 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-lg relative transition-colors flex items-center justify-center h-full">
              <MessageCircle className="h-6 w-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] text-[11px] bg-red-500 text-white rounded-full flex items-center justify-center font-medium px-1">
                7
              </span>
            </button>
            <button
              className="h-12 w-12 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-lg relative transition-colors flex items-center justify-center h-full notif-bell"
              onClick={handleNotifClick}
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6 text-gray-600" />
              {notifBadge > 0 && (
                <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] text-[11px] bg-red-500 text-white rounded-full flex items-center justify-center font-medium px-1 animate-pulse">
                  {notifBadge}
                </span>
              )}
            </button>
          </div>
          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* TODO: Connecter le bouton Créer à la création de contenu réelle */}
            {/* <button className="hidden sm:flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              <span>Créer</span>
            </button> */}
            <div className="flex items-center space-x-4 md:space-x-3 w-full">
              <button
                className="flex items-center space-x-2 focus:outline-none group"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-label="Ouvrir le menu profil"
              >
                <Avatar
                  userId={user?.id}
                  prenom={user?.prenom || ''}
                  nom={user?.nom || ''}
                  photo={getMediaUrl(user?.photo_profil)}
                  size={40}
                  className="h-9 w-9 sm:h-12 sm:w-12 md:h-10 md:w-10 ring-2 ring-blue-500 ring-offset-2 group-hover:ring-4 group-hover:ring-blue-300 transition-all duration-200"
                />
                <span className="hidden sm:block flex-1 text-sm sm:text-lg md:text-base font-bold text-gray-700 ml-1 truncate text-right group-hover:text-blue-600 transition-colors">
                  {user?.prenom}
                </span>
                <svg
                  className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                    profileMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {/* Menu profil dropdown */}
              {profileMenuOpen && (
                <div
                  ref={profileMenuRef}
                  className="absolute right-0 top-14 sm:top-16 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-in-up"
                >
                  <div className="flex flex-col items-center py-6 px-4">
                    <Avatar
                      userId={user?.id}
                      prenom={user?.prenom || ''}
                      nom={user?.nom || ''}
                      photo={getMediaUrl(user?.photo_profil)}
                      size={56}
                      className="mb-2 ring-2 ring-blue-400"
                    />
                    <div className="font-bold text-lg text-gray-900 mb-1 truncate w-full text-center">
                      {user?.prenom} {user?.nom}
                    </div>
                    <div className="text-gray-500 text-sm mb-4 truncate w-full text-center">
                      {user?.email}
                    </div>
                    <button
                      onClick={() => {
                        setChangePwdOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full py-2 mb-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-semibold shadow hover:from-blue-200 hover:to-blue-300 transition-all text-base border border-blue-200"
                    >
                      Modifier le mot de passe
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                      }}
                      className="w-full py-2 mt-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all text-base"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Overlay recherche mobile */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="relative w-full max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg p-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
              onClick={() => setSearchOpen(false)}
              aria-label="Fermer la recherche"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <UserSearchBar />
          </div>
        </div>
      )}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        loading={notifLoading}
        onMarkAsRead={handleMarkAsRead}
        onRefresh={loadNotifications}
        showToast={(msg) => success(msg)}
      />
      <ChangePasswordModal
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
        onSuccess={logout}
      />
    </nav>
  );
}
