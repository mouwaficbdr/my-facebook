import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import LoadingSection from './LoadingSection';
import Avatar from './Avatar';
import FriendSuggestionsModal from './FriendSuggestionsModal';
import { useNavigate } from 'react-router-dom';

interface FriendSuggestion {
  id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  mutual_friends: number;
}

export default function FriendSuggestionsSection() {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/friends/suggestions.php?limit=3`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success)
          throw new Error('Erreur lors du chargement des suggestions');
        setSuggestions(data.data?.suggestions || []);
      })
      .catch(() => {
        setError('Impossible de charger les suggestions.');
        toast.error('Erreur lors du chargement des suggestions.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (id: number) => {
    setSending(id);
    try {
      const res = await fetch(`${API_BASE}/api/friends/request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Demande envoyée !');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la demande.');
    } finally {
      setSending(null);
    }
  };

  const handleIgnore = (id: number) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="text-sm font-semibold text-gray-700 flex items-center mb-2">
        <UserPlus className="h-4 w-4 mr-2 text-blue-600" /> Suggestions d'amis
      </div>
      <div className="space-y-4">
        {loading ? (
          <LoadingSection
            message="Chargement des suggestions..."
            className="py-2"
            spinnerSize="small"
          />
        ) : error ? (
          <div className="text-center text-gray-400 text-sm py-6">{error}</div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2">
              <UserPlus className="h-7 w-7" />
            </div>
            <div className="text-gray-500 text-sm text-center max-w-[200px]">
              Aucune suggestion pour le moment. Ajoutez des amis pour enrichir
              votre réseau !
            </div>
          </div>
        ) : (
          <>
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-start space-x-3">
                <div
                  className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg cursor-pointer"
                  onClick={() => navigate(`/profile/${s.id}`)}
                  title={`${s.prenom} ${s.nom}`}
                >
                  <Avatar
                    prenom={s.prenom}
                    nom={s.nom}
                    photo={s.photo_profil}
                    size={48}
                    className="h-12 w-12 text-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                    onClick={() => navigate(`/profile/${s.id}`)}
                  >
                    {s.prenom} {s.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.mutual_friends} ami{s.mutual_friends > 1 ? 's' : ''} en
                    commun
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                      onClick={() => handleAdd(s.id)}
                      disabled={sending === s.id}
                    >
                      {sending === s.id ? 'Envoi...' : 'Ajouter'}
                    </button>
                    <button
                      className="flex-1 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium cursor-pointer"
                      onClick={() => handleIgnore(s.id)}
                      disabled={sending === s.id}
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              className="w-full mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
              onClick={() => setModalOpen(true)}
            >
              Voir plus de suggestions
            </button>
            {modalOpen && (
              <FriendSuggestionsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
