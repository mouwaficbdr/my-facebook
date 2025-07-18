import { useEffect, useState } from 'react';
import LoadingSection from '../LoadingSection';
import ModernToast from '../ModernToast';
import Avatar from '../Avatar';
import MutualFriendsModal from './MutualFriendsModal';
import type { ToastType } from '../ModernToast';
import { useNavigate } from 'react-router-dom';
import { Plus, X as XIcon, User as UserIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface FriendRequest {
  sender_id: number;
  nom: string;
  prenom: string;
  photo_profil?: string | null;
  created_at: string;
  mutual_friends_count: number;
}

interface FriendSuggestion {
  id: number;
  nom: string;
  prenom: string;
  photo_profil?: string | null;
  mutual_friends: number;
  total_friends: number;
  date_inscription: string;
}

export default function FriendsSection() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMutualModal, setShowMutualModal] = useState(false);
  const [mutualUserId, setMutualUserId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: ToastType }[]
  >([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null); // id en cours d'action
  const navigate = useNavigate();

  // Helper pour ajouter un toast
  const addToast = (message: string, type: ToastType = 'info') => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now() + '-' + Math.random(), message, type },
    ]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Charger les demandes reçues et suggestions
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/friends/received.php`, {
        credentials: 'include',
      }).then((res) => res.json()),
      fetch(`${API_BASE}/api/friends/suggestions.php`, {
        credentials: 'include',
      }).then((res) => res.json()),
    ])
      .then(([reqRes, sugRes]) => {
        let reqs = reqRes.success ? reqRes.requests || [] : [];
        let sugs = sugRes.success ? sugRes.data?.suggestions || [] : [];
        setRequests(reqs);
        setSuggestions(sugs);
        if (!reqRes.success)
          addToast(
            "Impossible de charger les demandes d'amis. Veuillez réessayer.",
            'error'
          );
        if (!sugRes.success)
          addToast(
            "Impossible de charger les suggestions d'amis. Veuillez réessayer.",
            'error'
          );
      })
      .catch(() => {
        setRequests([]);
        setSuggestions([]);
        addToast(
          "Impossible de charger les suggestions et demandes d'amis. Veuillez réessayer.",
          'error'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Actions demandes reçues
  const handleAccept = (sender_id: number) => {
    setActionLoading(sender_id);
    fetch(`${API_BASE}/api/friends/accept.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: sender_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message);
        setRequests((prev) => prev.filter((r) => r.sender_id !== sender_id));
        addToast('Demande acceptée.', 'success');
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setActionLoading(null));
  };
  const handleRefuse = (sender_id: number) => {
    setActionLoading(sender_id);
    fetch(`${API_BASE}/api/friends/refuse.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: sender_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message);
        setRequests((prev) => prev.filter((r) => r.sender_id !== sender_id));
        addToast('Demande supprimée.', 'success');
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setActionLoading(null));
  };

  // Action suggestions
  const handleAdd = (id: number) => {
    setActionLoading(id);
    fetch(`${API_BASE}/api/friends/request.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message);
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        addToast('Demande envoyée.', 'success');
      })
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setActionLoading(null));
  };
  // Supprimer une suggestion côté UI
  const handleRemoveSuggestion = (id: number) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  // Ouvre le modal mutual friends
  const openMutualModal = (userId: number) => {
    setMutualUserId(userId);
    setShowMutualModal(true);
  };

  return (
    <section className="w-full max-w-3xl mx-auto mt-6">
      {toasts.length > 0 && (
        <ModernToast toasts={toasts} onRemove={removeToast} />
      )}
      {loading ? (
        <LoadingSection message="Chargement des amis..." className="py-8" />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Demandes reçues : n'afficher la section que s'il y a des demandes */}
          {requests.length > 0 && (
            <div className="bg-white/80 rounded-2xl shadow-md border border-blue-100 p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                Demandes d’amis reçues
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {requests.map((req) => (
                  <div
                    key={req.sender_id}
                    className="flex flex-col justify-between bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden min-h-[340px] max-w-[200px] w-full mx-auto transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 group scale-95"
                    style={{ aspectRatio: '3/5' }}
                  >
                    {/* Rectangle de fond avec photo/avatar centré */}
                    <div
                      className="w-full bg-neutral-100 flex items-center justify-center overflow-hidden h-20 min-h-0"
                      style={{ height: '50%' }}
                    >
                      {req.photo_profil ? (
                        <img
                          src={req.photo_profil}
                          alt={req.prenom + ' ' + req.nom}
                          className="w-full h-full object-cover object-center rounded-t-2xl"
                          onClick={() => navigate(`/profile/${req.sender_id}`)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Avatar
                            prenom={req.prenom}
                            nom={req.nom}
                            size={80}
                            className="mx-auto my-auto shadow border-2 border-white cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                    {/* Infos utilisateur */}
                    <div className="flex flex-col items-center px-4 py-3 bg-transparent">
                      <span
                        className="font-bold text-gray-900 text-base text-center mb-1 cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/${req.sender_id}`)}
                      >
                        {req.prenom} {req.nom}
                      </span>
                      <button
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-2 mt-1"
                        onClick={() => openMutualModal(req.sender_id)}
                      >
                        <UserIcon className="w-4 h-4 text-blue-400" />
                        {req.mutual_friends_count} ami
                        {req.mutual_friends_count > 1 ? 's' : ''} en commun
                      </button>
                    </div>
                    {/* Boutons d’action */}
                    <div className="flex flex-col gap-2 px-4 pb-4 mt-auto">
                      <button
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold py-2 rounded-[5px] shadow hover:bg-blue-700 transition disabled:opacity-60 text-sm"
                        onClick={() => handleAccept(req.sender_id)}
                        disabled={actionLoading === req.sender_id}
                        title="Confirmer la demande d’ami"
                      >
                        Confirmer
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-[5px] shadow hover:bg-gray-200 transition text-sm"
                        onClick={() => handleRefuse(req.sender_id)}
                        disabled={actionLoading === req.sender_id}
                        title="Supprimer la demande d’ami"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Suggestions d’amis */}
          <div className="bg-white/80 rounded-2xl shadow-md border border-blue-100 p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Suggestions d’amis
            </h2>
            {suggestions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                Aucune suggestion disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="flex flex-col justify-between bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden min-h-[340px] max-w-[200px] w-full mx-auto transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 group scale-95"
                    style={{ aspectRatio: '3/5' }}
                  >
                    {/* Image de profil en haut */}
                    <div
                      className="w-full bg-neutral-100 flex items-center justify-center overflow-hidden h-1/2 min-h-0"
                      style={{ height: '50%' }}
                    >
                      {sug.photo_profil ? (
                        <img
                          src={sug.photo_profil}
                          alt={sug.prenom + ' ' + sug.nom}
                          className="w-full h-full object-cover object-center rounded-t-2xl"
                          onClick={() => navigate(`/profile/${sug.id}`)}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Avatar
                            prenom={sug.prenom}
                            nom={sug.nom}
                            size={80}
                            className="mx-auto my-auto shadow border-2 border-white cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                    {/* Infos utilisateur */}
                    <div className="flex flex-col items-center px-4 py-3 bg-transparent">
                      <span
                        className="font-bold text-gray-900 text-base text-center mb-1 cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/${sug.id}`)}
                      >
                        {sug.prenom} {sug.nom}
                      </span>
                      <button
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-2 mt-1"
                        onClick={() => openMutualModal(sug.id)}
                      >
                        <UserIcon className="w-4 h-4 text-blue-400" />
                        {sug.mutual_friends} ami
                        {sug.mutual_friends > 1 ? 's' : ''} en commun
                      </button>
                    </div>
                    {/* Boutons d’action */}
                    <div className="flex flex-col gap-2 px-4 pb-4 mt-auto">
                      <button
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold py-2 rounded-[5px] shadow hover:bg-blue-700 transition disabled:opacity-60 text-sm"
                        onClick={() => handleAdd(sug.id)}
                        disabled={actionLoading === sug.id}
                        title="Ajouter comme ami"
                      >
                        <Plus className="w-4 h-4" /> Ajouter
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-[5px] shadow hover:bg-gray-200 transition text-sm"
                        onClick={() => handleRemoveSuggestion(sug.id)}
                        disabled={actionLoading === sug.id}
                        title="Ignorer cette suggestion"
                      >
                        <XIcon className="w-4 h-4" /> Ignorer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal mutual friends */}
      {showMutualModal && mutualUserId && (
        <MutualFriendsModal
          userId={mutualUserId}
          onClose={() => setShowMutualModal(false)}
        />
      )}
    </section>
  );
}
