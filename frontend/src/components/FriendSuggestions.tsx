import React, { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface FriendSuggestion {
  id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  ville?: string;
  pays?: string;
  bio?: string;
  mutual_friends: number;
  last_activity_formatted: string;
}

export default function FriendSuggestions() {
  const { success, error } = useToast();
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequests, setSendingRequests] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/friends/suggestions.php?limit=5', {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.data.suggestions);
      } else {
        throw new Error(
          data.message || 'Erreur lors du chargement des suggestions'
        );
      }
    } catch (err: any) {
      error(err?.message || 'Erreur lors du chargement des suggestions');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    setSendingRequests((prev) => new Set(prev).add(userId));

    try {
      // TODO: Implémenter l'endpoint d'envoi de demande d'ami
      // const response = await fetch('/api/friends/request.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({ friend_id: userId })
      // });

      // Simulation pour l'instant
      await new Promise((resolve) => setTimeout(resolve, 1000));

      success("Demande d'ami envoyée !");

      // Retirer la suggestion de la liste
      setSuggestions((prev) => prev.filter((s) => s.id !== userId));
    } catch (err: any) {
      error(err?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setSendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const removeSuggestion = (userId: number) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== userId));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Suggestions d'amis</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Suggestions d'amis</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            Aucune suggestion pour le moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Suggestions d'amis</h3>

      <div className="space-y-4">
        {/* TODO: Suggestions d'amis statiques, à connecter à l'API */}
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-start space-x-3 group">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {suggestion.photo_profil ? (
                <img
                  src={suggestion.photo_profil}
                  alt={`${suggestion.prenom} ${suggestion.nom}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                `${suggestion.prenom.charAt(0)}${suggestion.nom.charAt(0)}`
              )}
            </div>

            {/* Informations */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {suggestion.prenom} {suggestion.nom}
              </div>

              {suggestion.mutual_friends > 0 && (
                <div className="text-sm text-blue-600 font-medium">
                  {suggestion.mutual_friends} ami
                  {suggestion.mutual_friends > 1 ? 's' : ''} en commun
                </div>
              )}

              {suggestion.ville && (
                <div className="text-sm text-gray-500">
                  {suggestion.ville}
                  {suggestion.pays && `, ${suggestion.pays}`}
                </div>
              )}

              {suggestion.bio && (
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {suggestion.bio}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-1">
                {suggestion.last_activity_formatted}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => sendFriendRequest(suggestion.id)}
                disabled={sendingRequests.has(suggestion.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                title="Ajouter comme ami"
              >
                {sendingRequests.has(suggestion.id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <UserPlus size={16} />
                )}
              </button>

              <button
                onClick={() => removeSuggestion(suggestion.id)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                title="Ignorer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton voir plus */}
      {suggestions.length >= 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
            Voir plus de suggestions
          </button>
        </div>
      )}
    </div>
  );
}
