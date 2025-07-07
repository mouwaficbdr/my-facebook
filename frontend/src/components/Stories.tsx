import { useEffect, useState } from 'react';
import { fetchStories } from '../api/stories';
import Loading from './Loading';
import { useToast } from '../hooks/useToast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function Stories() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchStories()
      .then((data) => {
        setStories(data);
        setFetchError(false);
      })
      .catch((err) => {
        setFetchError(true);
        toast.error(
          err.message || 'Erreur inconnue lors du chargement des stories.'
        );
        console.error('Erreur fetch stories:', err);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Loading />;

  // Bulle "Ajouter une story" (toujours visible)
  const addStoryBubble = (
    <div
      className="flex flex-col items-center w-20 sm:w-28 flex-shrink-0 cursor-pointer group"
      // TODO: onClick: ouvrir le modal d'ajout de story
    >
      <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden group transition-shadow hover:shadow-lg">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl sm:text-3xl mb-1">
            +
          </div>
        </div>
      </div>
      <span className="mt-2 sm:mt-3 text-xs sm:text-sm text-center text-gray-700 truncate w-full font-medium">
        Ajouter une story
      </span>
    </div>
  );

  // TODO: Affichage plein écran d'une story (façon Instagram/WhatsApp)
  // Au clic sur une story d'un autre utilisateur, ouvrir une vue modale plein écran affichant l'image, la légende en bas, et un bouton pour fermer.
  // À implémenter ici : gestion d'un état 'story ouverte', composant modal, etc.

  // TODO: Affichage de sa propre story
  // Au clic sur son propre rond, ouvrir la story de l'utilisateur actuel en plein écran, avec légende en bas.
  // Ajouter options : supprimer la story, voir le nombre de vues.
  // À implémenter ici : gestion d'un état 'ma story ouverte', actions de suppression, affichage des vues.

  // TODO: Bouton + pour ajout de story
  // Le bouton + doit ouvrir un formulaire/modal pour uploader une image et saisir une légende.
  // À implémenter ici : gestion d'un état 'modal ajout story', composant formulaire upload, appel API POST.

  return (
    <div className="mb-6">
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
        {addStoryBubble}
        {!fetchError && stories.length === 0 && (
          <div className="text-gray-500 text-center w-full">
            Aucune story à afficher.
          </div>
        )}
        {!fetchError &&
          stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-col items-center w-20 sm:w-28 flex-shrink-0"
            >
              <div
                className={`relative h-16 w-16 sm:h-24 sm:w-24 rounded-full border-4 border-blue-200 bg-gray-100 flex items-center justify-center overflow-hidden group cursor-pointer transition-shadow hover:shadow-lg`}
              >
                <img
                  src={
                    story.image.startsWith('http')
                      ? story.image
                      : `${API_BASE}/${story.image}`
                  }
                  alt={story.user_prenom + ' ' + story.user_nom}
                  className="h-full w-full object-cover rounded-full group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              </div>
              <span className="mt-2 sm:mt-3 text-xs sm:text-sm text-center text-gray-700 truncate w-full font-medium">
                {story.user_prenom} {story.user_nom}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
