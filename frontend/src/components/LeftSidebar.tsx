import { useAuth } from '../context/AuthContext';
import {
  User,
  Users,
  Users2,
  Play,
  Bookmark,
  BookOpen,
  Calendar,
} from 'lucide-react';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';

const iconComponents = {
  User,
  Users,
  Users2,
  Play,
  Bookmark,
  BookOpen,
  Calendar,
};

const sidebarItems = [
  { icon: 'Users2', label: 'Amis' },
  { icon: 'Bookmark', label: 'Enregistrés' },
  { icon: 'Play', label: 'Reels' },
  { icon: 'Users', label: 'Groupes' },
  { icon: 'BookOpen', label: 'Pages' },
  { icon: 'Calendar', label: 'Évènements' },
];

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionChange?: (
    section:
      | 'feed'
      | 'friends'
      | 'saved'
      | 'reels'
      | 'groupes'
      | 'pages'
      | 'evenements'
  ) => void;
}

export default function LeftSidebar({
  isOpen,
  onClose,
  onSectionChange,
}: LeftSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
            <div
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors px-3"
              onClick={() => navigate('/me')}
            >
              <Avatar
                userId={user?.id}
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
                  'text-green-500', // Amis
                  'text-yellow-500', // Enregistrés
                  'text-purple-500', // Reels
                  'text-blue-500', // Groupes
                  'text-pink-500', // Pages
                  'text-red-500', // Évènements
                ];
                return (
                  // TODO: Connecter "{item.label}" à la fonctionnalité réelle (navigation/API)
                  <button
                    key={index}
                    className="w-full flex items-center justify-start h-12 text-left relative hover:bg-gray-100 rounded-lg px-3"
                    onClick={() => {
                      if (item.label === 'Amis' && onSectionChange)
                        onSectionChange('friends');
                      else if (item.label === 'Enregistrés' && onSectionChange)
                        onSectionChange('saved');
                      else if (item.label === 'Reels' && onSectionChange)
                        onSectionChange('reels');
                      else if (item.label === 'Groupes' && onSectionChange)
                        onSectionChange('groupes');
                      else if (item.label === 'Pages' && onSectionChange)
                        onSectionChange('pages');
                      else if (item.label === 'Évènements' && onSectionChange)
                        onSectionChange('evenements');
                      else if (item.label === 'Publications' && onSectionChange)
                        onSectionChange('feed');
                    }}
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
            {/* Separator */}
            <div className="border-t border-gray-200 my-4"></div>
            {/* Amis en ligne Section */}
          </div>
        </div>
      </div>
    </>
  );
}
