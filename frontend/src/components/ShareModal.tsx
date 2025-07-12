import { useState, useEffect } from 'react';
import { X, Search, Send, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';

interface Friend {
  id: number;
  prenom: string;
  nom: string;
  photo_profil?: string | null;
}

interface Post {
  id: number;
  contenu: string;
  image_url?: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil?: string | null;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export default function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<number | null>(null);

  // Charger la liste d'amis au montage
  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  // Filtrer les amis selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        `${friend.prenom} ${friend.nom}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    if (!user?.id) {
      error('Utilisateur non connecté');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/list.php?id=${user.id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setFriends(data.friends || []);
        setFilteredFriends(data.friends || []);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement des amis');
      }
    } catch (err) {
      error('Impossible de charger la liste d\'amis');
      console.error('Erreur chargement amis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (friendId: number, friendName: string) => {
    setSharing(friendId);
    try {
      // Appel API réel pour partager le post
      const response = await fetch('/api/posts/share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          post_id: post.id,
          friend_id: friendId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        success(`Post partagé avec ${friendName} !`);
        onClose();
      } else {
        throw new Error(data.message || 'Erreur lors du partage');
      }
    } catch (err) {
      error('Erreur lors du partage');
    } finally {
      setSharing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Partager</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {post.photo_profil ? (
                <img
                  src={post.photo_profil}
                  alt={`${post.prenom} ${post.nom}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                `${post.prenom.charAt(0)}${post.nom.charAt(0)}`
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {post.prenom} {post.nom}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {post.contenu}
              </p>
              {post.image_url && (
                <div className="mt-2">
                  <img
                    src={post.image_url}
                    alt="Post content"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un ami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des amis...</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami pour le moment'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {friend.photo_profil ? (
                        <img
                          src={friend.photo_profil}
                          alt={`${friend.prenom} ${friend.nom}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        `${friend.prenom.charAt(0)}${friend.nom.charAt(0)}`
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {friend.prenom} {friend.nom}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShare(friend.id, `${friend.prenom} ${friend.nom}`)}
                    disabled={sharing === friend.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                      sharing === friend.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {sharing === friend.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="text-sm">Envoyer</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Le post sera envoyé en message privé à l'ami sélectionné
          </p>
        </div>
      </div>
    </div>
  );
} 