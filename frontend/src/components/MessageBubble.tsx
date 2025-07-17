import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import Avatar from './Avatar';
import { Download, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteMessage } from '../api/messages';
import { useToast } from '../hooks/useToast';
import ConfirmModal from './ConfirmModal';

interface MessageBubbleProps {
  message: {
    id: number;
    sender_id: number;
    receiver_id: number;
    contenu: string;
    type: 'text' | 'image';
    is_read: boolean;
    created_at: string;
    created_at_formatted: string;
    is_mine: boolean;
    sender: {
      nom: string;
      prenom: string;
      photo_profil: string | null;
    };
  };
  showAvatar?: boolean;
  onMessageDeleted?: (messageId: number) => void;
}

export default function MessageBubble({
  message,
  showAvatar = false,
  onMessageDeleted,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleImageClick = () => {
    if (message.type === 'image' && !imageError) {
      setShowFullImage(true);
    }
  };

  const handleDeleteMessage = async () => {
    setDeleting(true);
    try {
      await deleteMessage(message.id);
      success('Message supprimé');
      onMessageDeleted?.(message.id);
    } catch (err: any) {
      error(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
      setShowMenu(false);
    }
  };

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      <div
        className={cn(
          'group flex items-end space-x-2 max-w-[85%] relative',
          message.is_mine
            ? 'flex-row-reverse space-x-reverse ml-auto'
            : 'mr-auto'
        )}
      >
        {/* Avatar (seulement pour les messages reçus et si demandé) */}
        {showAvatar && !message.is_mine && (
          <Avatar
            userId={message.sender_id}
            prenom={message.sender.prenom}
            nom={message.sender.nom}
            photo={message.sender.photo_profil}
            size={32}
            className="mb-1 ring-2 ring-white shadow-sm"
          />
        )}

        {/* Bulle de message */}
        <div className="relative">
          {/* Menu contextuel pour les messages de l'utilisateur */}
          {message.is_mine && (
            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-7 h-7 bg-white/90 hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm hover:scale-105"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-9 z-50 min-w-[140px] bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 py-2 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowConfirm(true);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all duration-200 font-medium"
                    >
                      <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="w-2.5 h-2.5" />
                      </div>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className={cn(
              'relative rounded-2xl shadow-sm backdrop-blur-sm',
              message.type === 'image' ? 'p-1' : 'px-4 py-3',
              message.is_mine
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200'
                : 'bg-white text-gray-900 border border-gray-100 shadow-gray-100'
            )}
          >
            {message.type === 'image' ? (
              <div className="space-y-2">
                {imageLoading && (
                  <div className="w-48 h-32 bg-gray-200 rounded-xl flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {imageError ? (
                  <div className="w-48 h-32 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Image non disponible</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL || ''}/${
                      message.contenu
                    }`}
                    alt="Image partagée"
                    className={cn(
                      'w-full h-auto rounded-xl max-w-sm cursor-pointer hover:opacity-90 transition-opacity',
                      imageLoading && 'hidden'
                    )}
                    loading="lazy"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    onClick={handleImageClick}
                  />
                )}

                <div className="flex items-center justify-between px-3 pb-2">
                  <p
                    className={cn(
                      'text-xs opacity-75',
                      message.is_mine ? 'text-blue-100' : 'text-gray-500'
                    )}
                  >
                    {message.created_at_formatted}
                  </p>
                  {!imageError && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${
                          import.meta.env.VITE_API_BASE_URL || ''
                        }/${message.contenu}`;
                        link.download = `image_${message.id}`;
                        link.click();
                      }}
                      className={cn(
                        'p-1 rounded-full hover:bg-black/10 transition-colors',
                        message.is_mine ? 'text-blue-100' : 'text-gray-500'
                      )}
                      title="Télécharger l'image"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                  {message.contenu}
                </p>
                <p
                  className={cn(
                    'text-xs mt-2 opacity-75',
                    message.is_mine ? 'text-blue-100' : 'text-gray-500'
                  )}
                >
                  {message.created_at_formatted}
                </p>
              </>
            )}

            {/* Indicateur de lecture pour les messages envoyés */}
            {message.is_mine && (
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm',
                  message.is_read ? 'bg-green-500' : 'bg-gray-400'
                )}
                title={message.is_read ? 'Lu' : 'Envoyé'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal image plein écran */}
      {showFullImage && message.type === 'image' && !imageError && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={`${import.meta.env.VITE_API_BASE_URL || ''}/${
                message.contenu
              }`}
              alt="Image en plein écran"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDeleteMessage}
        title="Supprimer le message ?"
        message="Cette action est définitive. Le message sera supprimé pour tous les participants."
        confirmText={deleting ? 'Suppression...' : 'Supprimer'}
        cancelText="Annuler"
        type="danger"
        loading={deleting}
      />
    </>
  );
}
