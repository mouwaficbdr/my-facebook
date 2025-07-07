import { Search, Home, MessageCircle, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/facebook-blue-logo-full.png';
import logoMini from '../assets/facebook-logo-mini.png';
import UserSearchBar from './UserSearchBar';
import { useState } from 'react';
import Avatar from './Avatar';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
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
              <div className="flex-shrink-0">
                {/* Logo responsive : mini sur tablette, full ailleurs */}
                <img
                  src={logo}
                  alt="Logo Facebook"
                  className="h-8 sm:h-12 md:hidden lg:h-16 lg:w-auto w-auto drop-shadow-md"
                  style={{ filter: 'drop-shadow(0 0 16px #3b82f6aa)' }}
                />
                <img
                  src={logoMini}
                  alt="Logo Facebook Mini"
                  className="hidden md:block md:h-10 lg:hidden w-auto drop-shadow-md"
                  style={{ filter: 'drop-shadow(0 0 16px #3b82f6aa)' }}
                />
                <img
                  src={logo}
                  alt="Logo Facebook"
                  className="hidden lg:block h-16 w-auto drop-shadow-md"
                  style={{ filter: 'drop-shadow(0 0 16px #3b82f6aa)' }}
                />
              </div>
            </div>
            {/* Search bar desktop/tablette */}
            <div className="hidden md:block relative max-w-xs">
              <UserSearchBar />
            </div>
          </div>
          {/* Center navigation */}
          {/* TODO: Connecter chaque bouton central à la navigation réelle (Accueil, Amis, Messages, Notifications) */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-8 md:space-x-5">
            <button className="h-12 w-12 md:h-10 md:w-10 p-0 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center">
              <Home className="h-6 w-6 md:h-[22px] md:w-[22px]" />
            </button>
            <button className="h-12 w-12 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-lg relative transition-colors flex items-center justify-center">
              <MessageCircle className="h-6 w-6 md:h-[22px] md:w-[22px] text-gray-600" />
              <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] text-[11px] bg-red-500 text-white rounded-full flex items-center justify-center font-medium px-1">
                7
              </span>
            </button>
            <button className="h-12 w-12 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-lg relative transition-colors flex items-center justify-center">
              <Bell className="h-6 w-6 md:h-[22px] md:w-[22px] text-gray-600" />
              <span className="absolute -top-1 -right-1 h-[18px] min-w-[18px] text-[11px] bg-red-500 text-white rounded-full flex items-center justify-center font-medium px-1">
                12
              </span>
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
              {/* TODO: Connecter l'avatar utilisateur au menu profil/utilisateur */}
              <Avatar
                prenom={user?.prenom || ''}
                nom={user?.nom || ''}
                photo={user?.photo_profil}
                size={40}
                className="h-9 w-9 sm:h-12 sm:w-12 md:h-10 md:w-10 ring-2 ring-blue-500 ring-offset-2"
              />
              <span className="hidden sm:block flex-1 text-sm sm:text-lg md:text-base font-bold text-gray-700 ml-1 truncate text-right">
                {user?.prenom}
              </span>
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
    </nav>
  );
}
