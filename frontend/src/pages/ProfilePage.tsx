import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Image as ImageIcon,
  BookOpen,
  Award,
} from 'lucide-react';
import Loading from '../components/Loading';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import ActionButton from '../components/ActionButton';
import PostCard from '../components/PostCard';
import { fetchFriends } from '../api/users';
import { toggleLike } from '../api/feed';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  bio?: string;
  photo_profil?: string;
  cover_url?: string | null; // Ajout cover
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

// Ajouter la fonction utilitaire pour les erreurs
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Erreur inconnue';
}

// Lightbox pour zoom photo
function PhotoLightbox({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  if (!images.length) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <button
        className="absolute top-4 right-4 text-white text-3xl"
        onClick={onClose}
      >
        &times;
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl px-2"
        onClick={() => setCurrent((c) => (c > 0 ? c - 1 : c))}
        disabled={current === 0}
      >
        &#8592;
      </button>
      <img
        src={images[current]}
        alt="Photo"
        className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl"
      />
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl px-2"
        onClick={() => setCurrent((c) => (c < images.length - 1 ? c + 1 : c))}
        disabled={current === images.length - 1}
      >
        &#8594;
      </button>
    </div>
  );
}

function ProfilePhotosTab({
  images,
  lightboxIdx,
  setLightboxIdx,
  friendStatus,
  profile,
}: {
  images: string[];
  lightboxIdx: number | null;
  setLightboxIdx: (idx: number | null) => void;
  friendStatus: FriendStatus;
  profile: UserProfile;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <ImageIcon className="w-6 h-6 text-amber-500" />
        Photos ({images.length})
      </h3>
      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-12 h-12 text-amber-500" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune photo
          </h4>
          <p className="text-gray-500">
            {friendStatus === 'self'
              ? "Vous n'avez encore partagé aucune photo."
              : `${profile.prenom} n'a encore partagé aucune photo.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((url, idx) => (
              <button
                key={url + idx}
                className="aspect-square bg-gray-100 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setLightboxIdx(idx)}
              >
                <img
                  src={url}
                  alt="Photo"
                  className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
                />
              </button>
            ))}
          </div>
          {lightboxIdx !== null && (
            <PhotoLightbox
              images={images}
              index={lightboxIdx}
              onClose={() => setLightboxIdx(null)}
            />
          )}
        </>
      )}
    </div>
  );
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<
    'posts' | 'about' | 'friends' | 'photos'
  >('posts');
  const toast = useToast();
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const navigate = useNavigate();

  // Ajout pour la pagination des amis
  const [friendsPagination, setFriendsPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const loaderRefFriends = useRef<HTMLDivElement | null>(null);
  const [isFetchingMoreFriends, setIsFetchingMoreFriends] = useState(false);

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
      .catch((err: unknown) => {
        setFetchError(
          getErrorMessage(err) || 'Erreur lors du chargement du profil.'
        );
        toast.error(
          getErrorMessage(err) || 'Erreur lors du chargement du profil.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fonction pour charger plus d'amis au scroll
  const fetchMoreFriends = useCallback(() => {
    if (!profile || !friendsPagination.has_next || isFetchingMoreFriends)
      return;
    setIsFetchingMoreFriends(true);
    fetchFriends(
      profile.id,
      friendsPagination.current_page + 1,
      friendsPagination.per_page
    )
      .then(({ friends, pagination }) => {
        setFriends((prev) => [...prev, ...friends]);
        setFriendsPagination(pagination);
      })
      .catch((err) => {
        toast.error(err.message || 'Erreur lors du chargement des amis.');
      })
      .finally(() => setIsFetchingMoreFriends(false));
  }, [profile, friendsPagination, isFetchingMoreFriends, toast]);

  // IntersectionObserver pour infinite scroll amis
  useEffect(() => {
    if (activeTab !== 'friends') return;
    if (!loaderRefFriends.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreFriends();
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRefFriends.current);
    return () => observer.disconnect();
  }, [fetchMoreFriends, loaderRefFriends, activeTab]);

  // Chargement initial des amis (première page)
  useEffect(() => {
    if (!profile) return;
    setFriends([]);
    setFriendsPagination({
      current_page: 1,
      per_page: 20,
      total: 0,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    });
    fetchFriends(profile.id, 1, 20)
      .then(({ friends, pagination }) => {
        setFriends(friends);
        setFriendsPagination(pagination);
      })
      .catch((err) =>
        toast.error(err.message || 'Erreur lors du chargement des amis.')
      );
  }, [profile, toast]);

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

  // Fonction pour gérer le like sur un post
  const handleLikePost = async (
    postId: number,
    action: 'like' | 'unlike',
    type: string = 'like'
  ) => {
    try {
      const result = await toggleLike(postId, action, type);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                user_liked: result.user_liked,
                user_like_type: result.user_like_type,
                likes_count: result.reactions.total ?? 0,
              }
            : post
        )
      );
      return result;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la gestion du like';
      toast.error(message);
      throw err;
    }
  };

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (loading) return <Loading delay={300} />;
  if (fetchError)
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-red-500">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Impossible de charger le profil
        </h3>
        <p className="text-gray-500">{fetchError}</p>
      </div>
    );
  if (!profile) return null;

  const tabConfig = [
    {
      id: 'posts',
      label: 'Publications',
      icon: FileText,
      count: postsCount,
      color: 'blue',
    },
    {
      id: 'about',
      label: 'À propos',
      icon: BookOpen,
      color: 'emerald',
    },
    {
      id: 'friends',
      label: 'Amis',
      icon: Users,
      count: profile?.friends_count ?? friends.length,
      color: 'violet',
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: ImageIcon,
      color: 'amber',
    },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="w-full">
            {posts.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune publication
                </h3>
                <p className="text-gray-500">
                  {friendStatus === 'self'
                    ? "Vous n'avez encore publié aucun contenu."
                    : `${profile.prenom} n'a encore rien publié.`}
                </p>
              </div>
            ) : (
              <>
                {/* Pinterest-style Masonry Grid - 3 colonnes responsive */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6">
                  {posts.map((post, idx) => (
                    <div
                      key={`${activeTab}-post-${post.id}-${idx}`}
                      className="break-inside-avoid mb-6 w-full animate-fade-in-up"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="transform hover:scale-[1.02] transition-transform duration-300">
                        <PostCard
                          post={post}
                          onLike={handleLikePost}
                          onComment={(
                            postId: number,
                            _content: string,
                            commentsCount?: number
                          ) => {
                            // Mettre à jour le compteur de commentaires si fourni
                            if (commentsCount !== undefined) {
                              setPosts((prev) =>
                                prev.map((p) =>
                                  p.id === postId
                                    ? { ...p, comments_count: commentsCount }
                                    : p
                                )
                              );
                            }
                          }}
                          onDelete={handleDeletePost}
                          onSave={handleSavePost}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {pagination.has_next && (
                  <div ref={loaderRef} className="text-center py-8">
                    {isFetchingMore && <Spinner size="large" />}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-emerald-500" />
                Informations générales
              </h3>
              <div className="space-y-4">
                {profile.bio && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                    <FileText className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Bio</p>
                      <p className="text-gray-700 mt-1">{profile.bio}</p>
                    </div>
                  </div>
                )}
                {(profile.ville || profile.pays) && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                    <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Lieu de résidence
                      </p>
                      <p className="text-gray-700 mt-1">
                        {profile.ville}
                        {profile.ville && profile.pays && ', '}
                        {profile.pays}
                      </p>
                    </div>
                  </div>
                )}
                {profile.date_naissance && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                    <Calendar className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Date de naissance
                      </p>
                      <p className="text-gray-700 mt-1">
                        {formatDateFr(profile.date_naissance)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-yellow-500" />
                Statistiques
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-blue-50 rounded-2xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {postsCount}
                  </div>
                  <div className="text-sm text-gray-600">Publications</div>
                </div>
                <div className="text-center p-6 bg-violet-50 rounded-2xl">
                  <div className="text-3xl font-bold text-violet-600 mb-2">
                    {friends.length}
                  </div>
                  <div className="text-sm text-gray-600">Amis</div>
                </div>
                <div className="text-center p-6 bg-emerald-50 rounded-2xl">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {mutualFriendsCount}
                  </div>
                  <div className="text-sm text-gray-600">En commun</div>
                </div>
                <div className="text-center p-6 bg-amber-50 rounded-2xl">
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    0
                  </div>
                  <div className="text-sm text-gray-600">Photos</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'friends':
        return (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-violet-500" />
              Amis ({profile?.friends_count ?? friends.length})
            </h3>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-violet-500" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun ami
                </h4>
                <p className="text-gray-500">
                  {friendStatus === 'self'
                    ? "Vous n'avez pas encore d'amis."
                    : `${profile.prenom} n'a pas encore d'amis.`}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      to={`/profile/${friend.id}`}
                      className="text-center group cursor-pointer block"
                    >
                      <div className="relative mb-3">
                        <Avatar
                          prenom={friend.prenom}
                          nom={friend.nom}
                          photo={friend.photo_profil}
                          size={80}
                          className="mx-auto group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                        {friend.prenom} {friend.nom}
                      </p>
                    </Link>
                  ))}
                </div>
                {friendsPagination.has_next && (
                  <div ref={loaderRefFriends} className="text-center py-8">
                    {isFetchingMoreFriends && <Spinner size="large" />}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'photos': {
        const images = posts
          .filter((p) => p.type === 'image' && p.image_url)
          .map((p) => p.image_url!);
        return (
          <ProfilePhotosTab
            images={images}
            lightboxIdx={lightboxIdx}
            setLightboxIdx={setLightboxIdx}
            friendStatus={friendStatus}
            profile={profile}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mb-16">
      <Navbar onMenuClick={() => {}} />

      {/* Header Cover avec design pleine largeur */}
      <div className="relative">
        {/* Cover Image */}
        {profile.cover_url ? (
          <div className="h-80 lg:h-96 relative overflow-hidden">
            <img
              src={profile.cover_url}
              alt="Photo de couverture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="h-80 lg:h-96 bg-gradient-to-br from-[#1877F2] via-[#145DB2] to-[#1877F2] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div
              className={
                'absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-50'
              }
            />
          </div>
        )}
        {/* Profile Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-24 pb-8">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-8 pt-8 pb-0">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 sm:gap-8">
                  {/* Avatar et info principale */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      userId={profile.id}
                      prenom={profile.prenom}
                      nom={profile.nom}
                      photo={profile.photo_profil}
                      size={160}
                      className="border-6 border-white shadow-2xl"
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-0 break-words flex items-center gap-2">
                      {profile.prenom} {profile.nom}
                    </h1>
                    {/* Nombre d'amis sous le nom */}
                    <div className="flex items-center gap-2 mt-1 text-gray-700 font-medium text-base flex-wrap">
                      <span>
                        {profile.friends_count} ami
                        {profile.friends_count !== 1 ? 's' : ''}
                      </span>
                      <span className="mx-1">·</span>
                      <span>
                        {mutualFriendsCount} ami
                        {mutualFriendsCount !== 1 ? 's' : ''} en commun
                      </span>
                    </div>
                    {/* Bio juste après */}
                    {profile.bio && profile.bio.trim() !== '' ? (
                      <p className="text-lg text-gray-700 leading-relaxed max-w-full sm:max-w-2xl mt-2 break-words">
                        {profile.bio}
                      </p>
                    ) : (
                      <span className="italic text-gray-400 text-lg mt-2 block">
                        Aucune bio renseignée.
                      </span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <ActionButton
                      userId={profile.id}
                      status={friendStatus}
                      onStatusChange={setFriendStatus}
                    />
                    {friendStatus === 'friends' && (
                      <button
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                        onClick={() => navigate(`/messages?user=${profile.id}`)}
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">Message</span>
                      </button>
                    )}
                    <button className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Navigation Tabs */}
              <div className="border-t border-gray-100 mt-8">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {tabConfig.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const colorClasses = {
                      blue: isActive
                        ? 'text-blue-600 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600',
                      emerald: isActive
                        ? 'text-emerald-600 border-emerald-600 bg-emerald-50'
                        : 'text-gray-600 hover:text-emerald-600',
                      violet: isActive
                        ? 'text-violet-600 border-violet-600 bg-violet-50'
                        : 'text-gray-600 hover:text-violet-600',
                      amber: isActive
                        ? 'text-amber-600 border-amber-600 bg-amber-50'
                        : 'text-gray-600 hover:text-amber-600',
                    };
                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setActiveTab(
                            tab.id as 'posts' | 'about' | 'friends' | 'photos'
                          )
                        }
                        className={`flex items-center gap-3 px-8 py-4 font-semibold transition-all duration-300 border-b-4 whitespace-nowrap border-transparent ${
                          colorClasses[tab.color]
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                        {'count' in tab && tab.count !== undefined && (
                          <span className="ml-2 text-xs font-bold">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Contenu des tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
}
