import { useEffect, useState } from 'react';
import Avatar from '../Avatar';
import Loading from '../Loading';
import type { ToastType } from '../ModernToast';
import ModernToast from '../ModernToast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface MutualFriend {
  id: number;
  nom: string;
  prenom: string;
  photo_profil?: string | null;
}

interface MutualFriendsModalProps {
  userId: number;
  onClose: () => void;
}

export default function MutualFriendsModal({
  userId,
  onClose,
}: MutualFriendsModalProps) {
  const [mutuals, setMutuals] = useState<MutualFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: ToastType }[]
  >([]);
  const addToast = (message: string, type: ToastType = 'info') => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + '-' + Math.random(), message, type },
    ]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/friends/mutual.php?user_id=${userId}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Erreur');
        setMutuals(data.mutual_friends || []);
      })
      .catch(() => {
        setError('Impossible de charger les amis en commun.');
        addToast(
          'Erreur lors du chargement des amis en commun. Veuillez réessayer.',
          'error'
        );
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-xl font-bold"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>
        <h3 className="text-lg font-bold mb-4 text-gray-900 text-center">
          Amis en commun
        </h3>
        {toasts.length > 0 && (
          <ModernToast
            toasts={toasts}
            onRemove={removeToast}
            position="top-right"
          />
        )}
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : mutuals.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Aucun ami en commun.
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
            {mutuals.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 transition"
              >
                <Avatar
                  prenom={m.prenom}
                  nom={m.nom}
                  photo={m.photo_profil}
                  size={40}
                  className="shadow border border-white"
                />
                <span className="font-medium text-gray-900">
                  {m.prenom} {m.nom}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Overlay pour fermer */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-label="Fermer le modal"
      />
    </div>
  );
}
