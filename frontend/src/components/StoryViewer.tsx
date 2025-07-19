import { useEffect, useState } from 'react';
import type { Story } from '../api/stories';
import { fetchStoryViews, deleteStory } from '../api/stories';
import { useToast } from '../hooks/useToast';
import ImageLoader from './ImageLoader';
import { ChevronLeft, ChevronRight, XCircle, Eye, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Avatar from './Avatar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  isOwner: boolean;
}

export default function StoryViewer({
  story,
  onClose,
  onNext,
  onPrev,
  isOwner,
}: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] = useState(story.view_count || 0);
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const toast = useToast();

  // État pour suivre si l'image est chargée
  const [imageLoaded, setImageLoaded] = useState(false);

  // Gérer la progression automatique - ne commence qu'une fois l'image chargée
  useEffect(() => {
    // Réinitialiser l'état de chargement de l'image à chaque changement de story
    setImageLoaded(false);
    setProgress(0);

    // Ne pas démarrer le timer tant que l'image n'est pas chargée
    if (!imageLoaded) return;

    const duration = 5000; // 5 secondes par story
    const interval = 10; // Mise à jour toutes les 10ms
    const step = (interval / duration) * 100;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += step;
      setProgress(Math.min(currentProgress, 100));

      if (currentProgress >= 100 && onNext) {
        clearInterval(timer);
        onNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [story.id, onNext, imageLoaded]);

  // Charger les vues si l'utilisateur est le propriétaire
  useEffect(() => {
    if (isOwner) {
      loadViewers();
    }
  }, [isOwner, story.id]);

  const loadViewers = async () => {
    if (!isOwner) return;

    try {
      setLoading(true);
      const data = await fetchStoryViews(story.id);
      setViewers(data.views);
      setViewCount(data.count);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des vues');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteStory(story.id);
      toast.success('Story supprimée avec succès');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  // Gestion des touches clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && onNext) {
      onNext();
    } else if (e.key === 'ArrowLeft' && onPrev) {
      onPrev();
    }
  };

  // Gestion des gestes tactiles
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Seuil minimum pour considérer un swipe (en pixels)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onNext) {
      onNext();
    } else if (isRightSwipe && onPrev) {
      onPrev();
    }

    // Réinitialiser les valeurs
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Barre de progression - ne s'affiche que lorsque l'image est chargée */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-white"
          style={{
            width: `${progress}%`,
            transition: imageLoaded ? 'width 10ms linear' : 'none',
            opacity: imageLoaded ? 1 : 0,
          }}
        />
      </div>

      {/* Raccourcis clavier - Visible uniquement sur desktop */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-50 to-white/90 shadow-md px-5 py-2 rounded-xl flex items-center gap-5 text-blue-700 text-sm font-medium border border-blue-100 hidden sm:flex z-20">
        <span className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </span>
        <span className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4" /> Suivant
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold">Esc</span> Fermer
        </span>
      </div>

      {/* Bouton fermer */}
      <button
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-red-500 text-white rounded-full p-2 shadow-lg transition-colors focus:ring-2 focus:ring-blue-200"
        onClick={onClose}
        aria-label="Fermer"
      >
        <XCircle className="w-7 h-7" />
      </button>

      {/* Navigation - Visible uniquement sur desktop */}
      {onPrev && (
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg opacity-80 hover:opacity-100 transition-all duration-200 hidden sm:block focus:ring-2 focus:ring-blue-200"
          onClick={onPrev}
          aria-label="Précédent"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {onNext && (
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg opacity-80 hover:opacity-100 transition-all duration-200 hidden sm:block focus:ring-2 focus:ring-blue-200"
          onClick={onNext}
          aria-label="Suivant"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Instructions de swipe - Visible uniquement sur mobile */}
      <div className="absolute bottom-20 left-0 right-0 text-center text-white text-xs opacity-50 sm:hidden">
        Glissez pour naviguer entre les stories
      </div>

      {/* Contenu de la story */}
      <div className="relative max-w-3xl max-h-[90vh] w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2">
        <ImageLoader
          src={
            story.image.startsWith('http')
              ? story.image
              : `${API_BASE}/${story.image}`
          }
          alt={`Story de ${story.user_prenom} ${story.user_nom}`}
          className="w-full h-auto max-h-[80vh]"
          objectFit="contain"
          spinnerSize="large"
          spinnerColor="white"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            if (e?.target) {
              (e.target as HTMLImageElement).src = '/default-image.png';
            }
          }}
        />

        {/* Informations utilisateur */}
        <div className="absolute top-4 left-4 flex items-center">
          <Avatar
            userId={story.user_id}
            prenom={story.user_prenom}
            nom={story.user_nom}
            photo={story.user_avatar}
            size={40}
            className="border-2 border-white shadow"
          />
          <div className="ml-2 text-white">
            <div className="font-semibold">
              {story.user_prenom} {story.user_nom}
            </div>
            <div className="text-xs opacity-80">
              {new Date(story.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Légende */}
        {story.legend && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
            {story.legend}
          </div>
        )}

        {/* Actions pour le propriétaire */}
        {isOwner && (
          <div className="absolute bottom-4 right-4 flex items-center space-x-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-colors focus:ring-2 focus:ring-blue-300"
              onClick={() => setShowViewers(true)}
            >
              <Eye className="w-5 h-5" /> {viewCount}
            </button>

            <button
              className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-colors focus:ring-2 focus:ring-red-300"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              aria-label="Supprimer la story"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Modal des vues */}
      {showViewers && (
        <div className="absolute bottom-16 right-4 bg-white rounded-lg shadow-xl p-4 w-72 max-h-80 overflow-y-auto">
          <h3 className="font-semibold mb-2 text-gray-800">Vues par</h3>
          {loading ? (
            <p className="text-center py-4 text-gray-500">Chargement...</p>
          ) : viewers.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              Aucune vue pour le moment
            </p>
          ) : (
            <ul>
              {viewers.map((viewer) => (
                <li
                  key={viewer.id}
                  className="flex items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <img
                    src={
                      viewer.photo_profil
                        ? viewer.photo_profil.startsWith('http')
                          ? viewer.photo_profil
                          : `${API_BASE}/${viewer.photo_profil}`
                        : '/default-avatar.png'
                    }
                    alt={`${viewer.prenom} ${viewer.nom}`}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-2">
                    <div className="text-sm font-medium">
                      {viewer.prenom} {viewer.nom}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(viewer.viewed_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la story ?"
        message="Cette action est définitive. Voulez-vous vraiment supprimer cette story ?"
        confirmText={deleting ? 'Suppression...' : 'Supprimer'}
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}
