import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import ModernToast from '../components/ModernToast';
import { useToast } from '../hooks/useToast';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import ActionButton from '../components/ActionButton';
import PostCard from '../components/PostCard';
import FriendList from '../components/FriendList';
import { fetchFriends } from '../api/users';
// Ajout : importer API_BASE
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  bio?: string;
  photo_profil?: string;
  ville?: string;
  pays?: string;
  date_naissance?: string;
  friends_count: number;
}

type FriendStatus =
  | 'self'
  | 'not_friends'
  | 'request_sent'
  | 'request_received'
  | 'friends';

interface Post {
  id: number;
  contenu: string;
  image_url?: string;
  type: 'text' | 'image' | 'video';
  created_at_formatted: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  ville?: string;
  pays?: string;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  user_like_type?: string;
  comments: Comment[];
}

interface Comment {
  id: number;
  contenu: string;
  created_at_formatted: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
}

interface Friend {
  id: number;
  prenom: string;
  nom: string;
  photo_profil?: string | null;
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('not_friends');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [mutualFriendsCount, setMutualFriendsCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const toast = useToast();
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);

  // Infinite scroll: charger plus de posts quand on atteint le bas
  const fetchMorePosts = useCallback(() => {
    if (!pagination.has_next || isFetchingMore) return;
    setIsFetchingMore(true);
    fetch(
      `${API_BASE}/api/users/profile.php?id=${id}&page=${
        pagination.current_page + 1
      }&limit=10`,
      { credentials: 'include' }
    )
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setPosts((prev) => [...prev, ...data.data.posts]);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        setFetchError(err.message || 'Erreur lors du chargement des posts.');
        toast.error(err.message || 'Erreur lors du chargement des posts.');
      })
      .finally(() => setIsFetchingMore(false));
  }, [id, pagination, isFetchingMore, toast]);

  // IntersectionObserver pour infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchMorePosts, loaderRef]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    fetch(`${API_BASE}/api/users/profile.php?id=${id}&page=1&limit=10`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setProfile(data.data.user);
        setFriendStatus(data.data.friend_status);
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
        setMutualFriendsCount(data.data.mutual_friends_count || 0);
        setPostsCount(data.data.posts_count || 0);
      })
      .catch((err) => {
        setFetchError(err.message || 'Erreur lors du chargement du profil.');
        toast.error(err.message || 'Erreur lors du chargement du profil.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  // Fonction pour formater les dates en français
  const formatDateFr = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Fonctions pour gérer les actions sur les posts
  const handleDeletePost = (postId: number) => {
    fetch(`${API_BASE}/api/posts/delete.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ post_id: postId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        toast.success('Post supprimé avec succès');
      })
      .catch((err) => {
        toast.error(err.message || 'Erreur lors de la suppression');
      });
  };

  const handleSavePost = (postId: number, isSaved: boolean) => {
    fetch(`${API_BASE}/api/posts/save.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ post_id: postId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        // Afficher le message approprié selon l'état
        if (isSaved) {
          toast.success('Post enregistré');
        } else {
          toast.success('Post retiré des enregistrements');
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Erreur lors de la sauvegarde');
      });
  };

  useEffect(() => {
    if (!profile) return;
    setFriendsLoading(true);
    setFriendsError(null);
    fetchFriends(profile.id)
      .then(setFriends)
      .catch((err) =>
        setFriendsError(err.message || 'Erreur lors du chargement des amis.')
      )
      .finally(() => setFriendsLoading(false));
  }, [profile]);

  if (loading) return <Loading />;
  if (fetchError)
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">😕</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Impossible de charger le profil
        </h3>
        <p className="text-gray-500">{fetchError}</p>
      </div>
    );
  if (!profile) return null;

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <Navbar onMenuClick={() => {}} />
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8 pt-0 flex flex-col gap-8">
        {/* Header avec photo de profil et infos */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 h-64">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-700/20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-8">
                <Avatar
                  prenom={profile.prenom}
                  nom={profile.nom}
                  photo={profile.photo_profil}
                  size={140}
                  className="border-4 border-white shadow-2xl"
                />
                <div className="flex-1 text-white space-y-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                      {profile.prenom} {profile.nom}
                    </h1>
                    {(profile.ville ||
                      profile.pays ||
                      profile.date_naissance) && (
                      <div className="flex flex-wrap gap-3 items-center mb-3">
                        {profile.ville || profile.pays ? (
                          <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                            📍 {profile.ville}
                            {profile.ville && profile.pays ? ', ' : ''}
                            {profile.pays}
                          </span>
                        ) : null}
                        {profile.date_naissance && (
                          <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                            📅 {formatDateFr(profile.date_naissance)}
                          </span>
                        )}
                      </div>
                    )}
                    {profile.bio ? (
                      <p className="text-white/95 text-lg md:text-xl leading-relaxed max-w-2xl">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl italic">
                        Aucune bio renseignée
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <ActionButton
                    userId={profile.id}
                    status={friendStatus}
                    onStatusChange={setFriendStatus}
                  />
                  {friendStatus === 'friends' && (
                    <button
                      onClick={() => {}}
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105"
                    >
                      Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation avec onglets */}
          <div className="border-b border-gray-100 px-8 py-0">
            <div className="flex justify-between items-center">
              <div className="flex gap-8">
                <button className="px-6 py-4 font-semibold text-blue-600 border-b-2 border-blue-600">
                  Publications
                </button>
                <button className="px-6 py-4 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                  Amis
                </button>
                <button className="px-6 py-4 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                  Photos
                </button>
              </div>
              <div className="flex gap-8 py-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {friends.length}
                  </div>
                  <div className="text-sm text-gray-500">Amis</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-violet-600">
                    {postsCount}
                  </div>
                  <div className="text-sm text-gray-500">Publications</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-600">
                    {mutualFriendsCount}
                  </div>
                  <div className="text-sm text-gray-500">En commun</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Présentation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Présentation
              </h3>
              <div className="space-y-3">
                {profile.date_naissance && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">🎂</span>
                    <span>Né.e le {formatDateFr(profile.date_naissance)}</span>
                  </div>
                )}
                {(profile.ville || profile.pays) && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">📍</span>
                    <span>
                      Vit à {profile.ville}
                      {profile.ville && profile.pays ? ', ' : ''}
                      {profile.pays}
                    </span>
                  </div>
                )}
                {profile.bio && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">💬</span>
                    <span>{profile.bio}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Amis</h3>
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun ami pour le moment
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {friends.slice(0, 6).map((friend) => (
                    <div key={friend.id} className="text-center">
                      <Avatar
                        prenom={friend.prenom}
                        nom={friend.nom}
                        photo={friend.photo_profil}
                        size={48}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-gray-600 truncate">
                        {friend.prenom} {friend.nom}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal - Posts en liste verticale */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => {}}
                  onComment={() => {}}
                  onDelete={handleDeletePost}
                  onSave={handleSavePost}
                />
              ))}
              {posts.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-gray-500">Aucun post à afficher.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section amis (modale) */}
        {showFriendsList && (
          <div className="relative">
            <button
              className="absolute right-4 top-4 z-10 bg-white/80 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full shadow border border-blue-200 transition"
              onClick={() => setShowFriendsList(false)}
            >
              Fermer
            </button>
            {friendsLoading ? (
              <div className="text-gray-400 text-center py-8">
                Chargement des amis...
              </div>
            ) : friendsError ? (
              <div className="text-red-500 text-center py-8">
                {friendsError}
              </div>
            ) : (
              <FriendList
                friends={friends}
                total={friends.length}
                onSeeAll={() => {}}
              />
            )}
          </div>
        )}

        <ModernToast toasts={toast.toasts} onRemove={toast.removeToast} />
      </div>
    </div>
  );
}
