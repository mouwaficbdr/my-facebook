import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import ModernToast from '../components/ModernToast';
import FriendActionButton from '../components/FriendActionButton';
import PostCard from '../components/PostCard';
import { useToast } from '../hooks/useToast';
import Navbar from '../components/Navbar';

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

// Icônes Lucide (inline SVG pour éviter dépendance supplémentaire)
const UserGroupIcon = () => (
  <svg
    className="w-4 h-4 mr-1 text-blue-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-7a4 4 0 11-8 0 4 4 0 018 0zm6 13v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87"
    />
  </svg>
);
const FileTextIcon = () => (
  <svg
    className="w-4 h-4 mr-1 text-violet-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
    />
  </svg>
);
const UsersIcon = () => (
  <svg
    className="w-4 h-4 mr-1 text-gray-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-7a4 4 0 11-8 0 4 4 0 018 0zm6 13v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87"
    />
  </svg>
);

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

  // Infinite scroll: charger plus de posts quand on atteint le bas
  const fetchMorePosts = useCallback(() => {
    if (!pagination.has_next || isFetchingMore) return;
    setIsFetchingMore(true);
    fetch(
      `/api/users/profile.php?id=${id}&page=${
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
    fetch(`/api/users/profile.php?id=${id}&page=1&limit=10`, {
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

  // Responsive layout: header full width, content grid on desktop
  return (
    <div className="min-h-screen w-full bg-slate-100">
      <Navbar onMenuClick={() => {}} />
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 pt-0 flex flex-col gap-8">
        {/* Header immersif */}
        <section
          className="w-full bg-blue-50/90 backdrop-blur-md rounded-3xl shadow-xl border border-blue-100 flex flex-col md:flex-row items-center md:items-stretch gap-12 p-8 md:p-16 min-h-[340px] md:min-h-[420px] animate-fade-in -mt-12 md:-mt-16 z-10 relative"
          style={{ paddingTop: '6.5rem' }}
        >
          {/* Avatar large + actions */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start justify-center h-full">
            <Avatar
              prenom={profile.prenom}
              nom={profile.nom}
              photo={profile.photo_profil}
              size={148}
              className="mb-6 shadow-2xl border-4 border-white"
            />
            {/* Actions rapides */}
            <div className="flex flex-row gap-2 w-full justify-center md:justify-start">
              <FriendActionButton
                userId={profile.id}
                status={friendStatus}
                onStatusChange={setFriendStatus}
              />
              {/* Bouton message (UI, à relier au chat si besoin) */}
              <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-lg shadow-sm border border-blue-100 transition cursor-pointer">
                Message
              </button>
            </div>
          </div>
          {/* Infos principales */}
          <div className="flex-1 flex flex-col justify-center h-full gap-6">
            <div className="flex flex-col items-center md:items-start gap-2 w-full">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center md:text-left w-full">
                {profile.prenom} {profile.nom}
              </h2>
              {/* Section bio, toujours présente (placeholder si absente) */}
              <div className="w-full flex items-center justify-center md:justify-start min-h-[48px]">
                {profile.bio ? (
                  <p className="text-gray-700 text-xl text-center md:text-left max-w-2xl w-full">
                    {profile.bio}
                  </p>
                ) : (
                  <span className="italic text-gray-400 text-lg">
                    Aucune bio renseignée.
                  </span>
                )}
              </div>
            </div>
            {/* Stats */}
            <div className="flex flex-wrap gap-3 my-2 justify-center md:justify-start">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center">
                <UserGroupIcon />
                {profile.friends_count} ami
                {profile.friends_count !== 1 ? 's' : ''}
              </span>
              <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center">
                <FileTextIcon />
                {postsCount} post{postsCount !== 1 ? 's' : ''}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center">
                <UsersIcon />
                {mutualFriendsCount} ami{mutualFriendsCount !== 1 ? 's' : ''} en
                commun
              </span>
            </div>
            {/* Infos secondaires */}
            <div className="flex flex-wrap gap-4 mt-2 text-gray-500 text-sm">
              {profile.ville && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {profile.ville}
                  {profile.pays ? ', ' + profile.pays : ''}
                </span>
              )}
              {profile.date_naissance && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3"
                    />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {new Date(profile.date_naissance).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Section posts publics */}
        <section className="w-full">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Publications
          </h3>
          {posts.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              Aucun post à afficher.
            </div>
          ) : (
            // Préparer la grid artistique (masonry) à activer plus tard
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appliquer un fond original à chaque card */}
              {posts.map((post: Post) => (
                <div
                  key={post.id}
                  className="bg-blue-50/90 backdrop-blur-md rounded-2xl shadow-md border border-blue-100 p-0"
                >
                  <PostCard
                    post={post}
                    onLike={() => {}}
                    onComment={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
          {/* Infinite scroll loader */}
          <div ref={loaderRef} className="flex justify-center py-6">
            {isFetchingMore && <Loading />}
          </div>
        </section>
        <ModernToast toasts={toast.toasts} onRemove={toast.removeToast} />
      </div>
    </div>
  );
}
