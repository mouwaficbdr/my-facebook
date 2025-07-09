import { useEffect, useState } from 'react';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import { getFeed, toggleLike, type Post } from '../api/feed';
import { useToast } from '../hooks/useToast';
import { Search } from 'lucide-react';
import Stories from './Stories';

export default function Feed() {
  const { success, error } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line
  }, []);

  const loadFeed = async (page: number = 1, append: boolean = false) => {
    try {
      const feedData = await getFeed(page, 10);
      if (append) {
        setPosts((prev) => [...prev, ...feedData.posts]);
      } else {
        setPosts(feedData.posts);
      }
      setCurrentPage(feedData.pagination.current_page);
      setHasMore(feedData.pagination.has_next);
      setFetchError(null);
    } catch (err: any) {
      error(err?.message || 'Erreur lors du chargement du feed');
      setFetchError(err?.message || 'Erreur lors du chargement du feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadFeed(currentPage + 1, true);
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    success('Post créé avec succès !');
  };

  const handleLike = async (
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
                likes_count: Object.values(result.reactions).reduce(
                  (a, b) => a + b,
                  0
                ),
              }
            : post
        )
      );
    } catch (err: any) {
      error(err?.message || 'Erreur lors de la gestion du like');
    }
  };

  const handleComment = async () => {
    // TODO: Implémenter l'ajout de commentaires (API/backend)
  };

  return (
    <div className="flex-1 max-w-full md:max-w-2xl xl:max-w-3xl mx-auto h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-0 sm:px-2">
      <div className="p-4">
        <Stories />
        <CreatePost onPostCreated={handlePostCreated} />
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Impossible de charger le feed
            </h3>
            <p className="text-gray-500">{fetchError}</p>
            <button
              onClick={() => {
                setLoading(true);
                loadFeed();
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun post pour le moment
            </h3>
            <p className="text-gray-500">
              Soyez le premier à partager quelque chose !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
              />
            ))}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingMore ? 'Chargement...' : 'Charger plus de posts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
