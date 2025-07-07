import { useAuth } from '../context/AuthContext';
import { User, Users, Users2, Play, Bookmark, ChevronDown } from 'lucide-react';
import Avatar from './Avatar';

const iconComponents = {
  User,
  Users,
  Users2,
  Play,
  Bookmark,
};

const sidebarItems = [
  { icon: 'User', label: 'Profil' },
  { icon: 'Users2', label: 'Amis' },
  { icon: 'Bookmark', label: 'Enregistrés' },
  { icon: 'Play', label: 'Vidéos' },
];

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const { user } = useAuth();
  const { logout } = useAuth();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-gray-200 lg:block lg:h-full flex flex-col
        `}
      >
        <div className="flex flex-col h-full pt-4 pb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="px-4 space-y-3">
            {/* User Profile Section */}
            {/* TODO: Connecter le clic sur le profil à la page profil réelle */}
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors mx-3">
              <Avatar
                prenom={user?.prenom || ''}
                nom={user?.nom || ''}
                photo={user?.photo_profil}
                size={40}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-gray-900 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-[13px] text-gray-500">Voir votre profil</p>
              </div>
            </div>
            {/* Navigation Items */}
            <div className="space-y-1">
              {sidebarItems.map((item, index) => {
                const IconComponent =
                  iconComponents[item.icon as keyof typeof iconComponents];
                // Palette d'icônes colorées
                const iconColors = [
                  'text-blue-600', // Profil
                  'text-green-500', // Amis
                  'text-yellow-500', // Enregistrés
                  'text-purple-500', // Vidéos
                ];
                return (
                  // TODO: Connecter "{item.label}" à la fonctionnalité réelle (navigation/API)
                  <button
                    key={index}
                    className="w-full flex items-center justify-start h-12 text-left relative hover:bg-gray-100 rounded-lg px-3"
                  >
                    <div className="w-9 h-9 mr-3 flex items-center justify-center flex-shrink-0">
                      {IconComponent && (
                        <IconComponent
                          className={`h-6 w-6 ${iconColors[index]}`}
                        />
                      )}
                    </div>
                    <span className="text-[15px] font-medium text-gray-700 flex-1 truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* See More Button */}
            {/* TODO: Implémenter la fonctionnalité "Voir plus" */}
            <button className="w-full flex items-center justify-start h-12 text-left hover:bg-gray-100 rounded-lg px-3">
              <div className="w-9 h-9 mr-3 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <ChevronDown className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-[15px] font-medium text-gray-700">
                Voir plus
              </span>
            </button>
            {/* Separator */}
            <div className="border-t border-gray-200 my-4"></div>
            {/* Amis en ligne Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2">
                Amis en ligne
              </h3>
              {/* TODO: Remplacer par la vraie liste d'amis en ligne via l'API */}
              <div className="space-y-1">
                {[
                  {
                    nom: 'Emma',
                    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
                  },
                  {
                    nom: 'Lucas',
                    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
                  },
                  {
                    nom: 'Marie',
                    photo: 'https://randomuser.me/api/portraits/women/65.jpg',
                  },
                  {
                    nom: 'Thomas',
                    photo: 'https://randomuser.me/api/portraits/men/41.jpg',
                  },
                  {
                    nom: 'Sophie',
                    photo: 'https://randomuser.me/api/portraits/women/12.jpg',
                  },
                  {
                    nom: 'Alex',
                    photo: 'https://randomuser.me/api/portraits/men/22.jpg',
                  },
                  {
                    nom: 'Nina',
                    photo: 'https://randomuser.me/api/portraits/women/33.jpg',
                  },
                  {
                    nom: 'Paul',
                    photo: 'https://randomuser.me/api/portraits/men/55.jpg',
                  },
                ].map((ami, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <Avatar
                        prenom={ami.nom}
                        nom={ami.nom}
                        photo={ami.photo}
                        size={36}
                      />
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                    </div>
                    <span className="text-[15px] font-medium text-gray-700 truncate">
                      {ami.nom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Bouton temporaire de déconnexion en bas */}
          <div className="p-4 border-t border-gray-100 mt-auto">
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
