import { useAuth } from '../context/AuthContext';
import {
  Home,
  User,
  Users,
  MessageCircle,
  Bell,
  Bookmark,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarNavProps {
  onLogout: () => void;
}

export default function SidebarNav({ onLogout }: SidebarNavProps) {
  const { user } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: 'Accueil',
      href: '/',
      active: true,
    },
    {
      icon: User,
      label: 'Profil',
      href: '/profile',
      active: false,
    },
    {
      icon: Users,
      label: 'Amis',
      href: '/friends',
      active: false,
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      href: '/messages',
      active: false,
      badge: 3,
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      active: false,
      badge: 5,
    },
    {
      icon: Bookmark,
      label: 'Sauvegardés',
      href: '/saved',
      active: false,
    },
    {
      icon: Calendar,
      label: 'Événements',
      href: '/events',
      active: false,
    },
    {
      icon: Settings,
      label: 'Paramètres',
      href: '/settings',
      active: false,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.photo_profil ? (
              <img
                src={user.photo_profil}
                alt={`${user.prenom} ${user.nom}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              `${user?.prenom.charAt(0)}${user?.nom.charAt(0)}`
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {user?.prenom} {user?.nom}
            </div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  item.active
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    size={20}
                    className={`${
                      item.active
                        ? 'text-blue-600'
                        : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Section amis en ligne */}
      <div className="p-4 border-t border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Amis en ligne</h3>
        <div className="space-y-3">
          {/* Amis de test */}
          {[
            { name: 'Marie Dupont', status: 'online' },
            { name: 'Thomas Martin', status: 'online' },
            { name: 'Sophie Bernard', status: 'away' },
          ].map((friend, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {friend.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    friend.status === 'online'
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {friend.name}
                </div>
                <div className="text-xs text-gray-500">
                  {friend.status === 'online' ? 'En ligne' : 'Absent'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton déconnexion */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
          <span className="font-medium">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
