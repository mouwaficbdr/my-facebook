import React from 'react';
import {
  Bell,
  UserPlus,
  Heart,
  MessageCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import Avatar from './Avatar';
import type { Notification } from '../api/notifications';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: number) => Promise<void>;
  onRefresh: () => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

function getIcon(type: string) {
  switch (type) {
    case 'friend_request':
      return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'like':
      return <Heart className="w-5 h-5 text-rose-500" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5 text-emerald-500" />;
    case 'info':
      return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-400" />;
  }
}

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'À l’instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return date.toLocaleDateString();
}

// TODO: Amélioration UX notifications
// Chaque notification du panel doit être cliquable :
// - Si c’est une demande d’ami ou une acceptation, cliquer doit rediriger vers le profil de la personne concernée (user_id dans notif.data)
// - Si c’est un like ou un commentaire sur un post, cliquer doit rediriger vers le post concerné (post_id dans notif.data)
// - L’action doit aussi marquer la notification comme lue si ce n’est pas déjà le cas
// Cette logique doit être implémentée dans le mapping des notifications ci-dessous, en utilisant useNavigate/react-router.
//
// (Voir la règle projet : UX Facebook, notifications interactives, navigation fluide)
export default function NotificationPanel({
  open,
  onClose,
  notifications,
  loading,
  onMarkAsRead,
  onRefresh,
  showToast,
}: NotificationPanelProps) {
  const [loadingIds, setLoadingIds] = React.useState<number[]>([]);
  if (!open) return null;
  const handleMarkAsRead = async (id: number) => {
    setLoadingIds((prev) => [...prev, id]);
    try {
      await onMarkAsRead(id);
      showToast?.('Notification marquée comme lue', 'success');
    } catch (e: any) {
      showToast?.(e?.message || 'Erreur lors du marquage', 'error');
    } finally {
      setLoadingIds((prev) => prev.filter((x) => x !== id));
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/10"
      onClick={onClose}
    >
      <div
        className="mt-2 mr-2 md:mt-4 md:mr-4 w-full max-w-xs md:max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 animate-fade-in-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            <span className="font-bold text-base md:text-lg text-gray-800">
              Notifications
            </span>
          </div>
          <button
            className="text-xs text-blue-600 hover:underline font-medium"
            onClick={onRefresh}
            title="Rafraîchir"
          >
            Rafraîchir
          </button>
        </div>
        <div className="max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            !loading &&
            notifications.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                Aucune notification pour l'instant
              </div>
            )
          )}
          {notifications.length > 0 &&
            notifications.map((notif) => {
              // Cast local pour éviter les erreurs de build
              const data = notif.data as {
                avatar?: string | null;
                user_id?: number;
                prenom?: string;
                nom?: string;
                title?: string;
                description?: string;
              };
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 md:px-5 py-3 md:py-4 border-b border-gray-50 transition-colors ${
                    !notif.is_read ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {data.avatar && (
                        <Avatar
                          userId={data.user_id}
                          prenom={data.prenom || ''}
                          nom={data.nom || ''}
                          photo={data.avatar}
                          size={32}
                          className="h-8 w-8 ring-1 ring-blue-200"
                        />
                      )}
                      <span className="font-medium text-gray-800 truncate">
                        {data.title || 'Notification'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {data.description || ''}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatRelative(notif.created_at)}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <button
                      className="ml-2 mt-1 w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center"
                      title="Marquer comme lue"
                      aria-label="Marquer la notification comme lue"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={loadingIds.includes(notif.id)}
                    >
                      {loadingIds.includes(notif.id) ? (
                        <svg
                          className="animate-spin h-4 w-4 text-blue-500"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                      ) : (
                        <Eye className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
