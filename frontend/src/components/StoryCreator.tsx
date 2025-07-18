import { useState, useRef, useContext, useEffect } from 'react';
import { createStory } from '../api/stories';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { testAuth } from '../api/test';
import { debugAuth } from '../api/debug';

interface StoryCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StoryCreator({
  onClose,
  onSuccess,
}: StoryCreatorProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legend, setLegend] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [authStatus, setAuthStatus] = useState<any>(null);

  // Nous n'avons pas besoin de tester l'authentification au chargement du composant
  // car nous utilisons le paramètre debug_user_id pour l'authentification

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5MB)");
      return;
    }

    setImage(file);
    setError(null);

    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('Vous devez être connecté pour publier une story');
      toast.error('Vous devez être connecté pour publier une story');
      return;
    }

    if (!image) {
      setError('Veuillez sélectionner une image');
      return;
    }

    try {
      setLoading(true);

      // Créer la FormData pour l'upload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('legend', legend);

      // Ajouter l'ID utilisateur comme paramètre de requête pour l'authentification
      if (user && user.id) {
        formData.append('debug_user_id', user.id.toString());
        console.log('Utilisation de debug_user_id:', user.id);
      } else {
        console.error('Utilisateur non identifié');
        setError('Utilisateur non identifié. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      // Créer la story
      await createStory(formData);
      toast.success('Story publiée avec succès !');
      onSuccess();
    } catch (err: any) {
      console.error('Erreur lors de la création de la story:', err);
      setError(err.message || 'Une erreur est survenue lors de la publication');
      toast.error(err.message || 'Erreur lors de la publication de la story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Créer une story</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md mb-4">
              Vous devez être connecté pour publier une story.
            </div>
          )}

          <div className="mb-4">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Aperçu"
                  className="w-full h-64 object-contain border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span className="mt-2 text-gray-500">
                  Cliquez pour ajouter une image
                </span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="legend"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Légende
            </label>
            <textarea
              id="legend"
              value={legend}
              onChange={(e) => setLegend(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ajoutez une légende à votre story..."
              maxLength={255}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {legend.length}/255
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading || !image || !isAuthenticated}
            >
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
