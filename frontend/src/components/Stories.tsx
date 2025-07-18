import { useEffect, useState } from 'react';
import { fetchStories } from '../api/stories';
import type { Story, UserStories } from '../api/stories';
import LoadingSection from './LoadingSection';
import { useToast } from '../hooks/useToast';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { Plus } from 'lucide-react';

export default function Stories() {
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [activeStory, setActiveStory] = useState<{
    userIndex: number;
    storyIndex: number;
    story: Story;
  } | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  const loadStories = () => {
    setLoading(true);
    fetchStories()
      .then((data) => {
        setUserStories(data);
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
  };

  useEffect(() => {
    loadStories();
  }, [toast]);

  const handleStoryClick = (userIndex: number, storyIndex: number) => {
    const story = userStories[userIndex].stories[storyIndex];
    setActiveStory({
      userIndex,
      storyIndex,
      story,
    });
  };

  const handleNextStory = () => {
    if (!activeStory) return;

    const { userIndex, storyIndex } = activeStory;
    const currentUserStories = userStories[userIndex].stories;

    // S'il y a une autre story du même utilisateur
    if (storyIndex < currentUserStories.length - 1) {
      setActiveStory({
        userIndex,
        storyIndex: storyIndex + 1,
        story: currentUserStories[storyIndex + 1],
      });
      return;
    }

    // Sinon, passer à l'utilisateur suivant
    if (userIndex < userStories.length - 1) {
      const nextUserIndex = userIndex + 1;
      setActiveStory({
        userIndex: nextUserIndex,
        storyIndex: 0,
        story: userStories[nextUserIndex].stories[0],
      });
      return;
    }

    // Si c'est la dernière story du dernier utilisateur, fermer le viewer
    setActiveStory(null);
  };

  const handlePrevStory = () => {
    if (!activeStory) return;

    const { userIndex, storyIndex } = activeStory;

    // S'il y a une story précédente du même utilisateur
    if (storyIndex > 0) {
      setActiveStory({
        userIndex,
        storyIndex: storyIndex - 1,
        story: userStories[userIndex].stories[storyIndex - 1],
      });
      return;
    }

    // Sinon, passer à l'utilisateur précédent
    if (userIndex > 0) {
      const prevUserIndex = userIndex - 1;
      const prevUserStories = userStories[prevUserIndex].stories;
      setActiveStory({
        userIndex: prevUserIndex,
        storyIndex: prevUserStories.length - 1,
        story: prevUserStories[prevUserStories.length - 1],
      });
      return;
    }

    // Si c'est la première story du premier utilisateur, ne rien faire
  };

  const handleStoryCreated = () => {
    setShowCreator(false);
    loadStories();
    toast.success('Votre story a été publiée avec succès !');
  };

  if (loading)
    return (
      <LoadingSection message="Chargement des stories..." className="py-8" />
    );

  // Bulle "Ajouter une story" (toujours visible)
  const addStoryBubble = (
    <div
      className="flex flex-col items-center w-20 sm:w-28 flex-shrink-0 cursor-pointer group"
      onClick={() => setShowCreator(true)}
    >
      <div className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-full border-4 border-blue-400 bg-gray-100 flex items-center justify-center overflow-hidden group transition-shadow hover:shadow-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-blue-500 flex items-center justify-center">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
      </div>
      <span className="mt-2 sm:mt-3 text-xs sm:text-sm text-center text-gray-700 truncate w-full font-medium">
        Ajouter une story
      </span>
    </div>
  );

  return (
    <div className="mb-6">
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
        {addStoryBubble}
        {!fetchError && userStories.length === 0 && (
          <div className="text-gray-500 text-center w-full">
            Aucune story à afficher.
          </div>
        )}
        {!fetchError &&
          userStories.map((userStory, userIndex) => (
            <div
              key={userStory.user_id}
              className="flex flex-col items-center w-20 sm:w-28 flex-shrink-0"
            >
              <div
                className={`relative h-16 w-16 sm:h-24 sm:w-24 rounded-full border-4 ${
                  // Vérifier si toutes les stories de l'utilisateur ont été vues
                  userStory.stories.every((s) => s.viewed_by_me)
                    ? 'border-gray-300'
                    : 'border-blue-500'
                } bg-gray-100 flex items-center justify-center overflow-hidden group cursor-pointer transition-shadow hover:shadow-lg`}
                onClick={() => handleStoryClick(userIndex, 0)}
              >
                <Avatar
                  userId={userStory.user_id}
                  prenom={userStory.user_prenom}
                  nom={userStory.user_nom}
                  photo={userStory.user_avatar}
                  size={96}
                  className="h-full w-full rounded-full group-hover:scale-105 transition-transform"
                />

                {/* Indicateur de nombre de stories */}
                {/* Supprimer le bloc qui affiche le compteur */}
              </div>
              <span className="mt-2 sm:mt-3 text-xs sm:text-sm text-center text-gray-700 truncate w-full font-medium">
                {userStory.user_prenom} {userStory.user_nom}
              </span>
            </div>
          ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <StoryViewer
          story={activeStory.story}
          onClose={() => setActiveStory(null)}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
          isOwner={user?.id === activeStory.story.user_id}
        />
      )}

      {/* Story Creator Modal */}
      {showCreator && (
        <StoryCreator
          onClose={() => setShowCreator(false)}
          onSuccess={handleStoryCreated}
        />
      )}
    </div>
  );
}
