import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import { getFeed, toggleLike, type Post } from '../api/feed';
import { useToast } from '../hooks/useToast';
import { Search } from 'lucide-react';
import Stories from './Stories';

// Debounce hook pour optimiser les appels
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
}

export default function Feed() {
  const { success, error } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Ref pour l'élément de déclenchement de l'infinite scroll
  const observerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line
  }, []);

  // Intersection Observer optimisé pour l'infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loadingMore && !loading) {
          // Utilisation de requestAnimationFrame pour optimiser le timing
          requestAnimationFrame(() => {
            loadMorePosts();
          });
        }
      },
      {
        rootMargin: '300px', // Augmentation pour un chargement encore plus anticipé
        threshold: 0.05, // Réduction du threshold pour une détection plus sensible
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loadingMore, loading]);

  // Fonction pour mélanger un tableau (algorithme Fisher-Yates)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadFeed = async (page: number = 1, append: boolean = false) => {
    try {
      const feedData = await getFeed(page, 20);
      if (append) {
        setPosts((prev) => [...prev, ...feedData.posts]);
      } else {
        // Shuffle les posts seulement pour le chargement initial (page 1)
        const shuffledPosts =
          page === 1 ? shuffleArray(feedData.posts) : feedData.posts;
        setPosts(shuffledPosts);
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

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadFeed(currentPage + 1, true);
  }, [loadingMore, hasMore, currentPage]);

  // Debounced version pour éviter les appels multiples
  const debouncedLoadMore = useDebounce(loadMorePosts, 100);

  const handlePostCreated = useCallback(
    (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    success('Post créé avec succès !');
    },
    [success]
  );

  const handleLike = useCallback(
    async (
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
    } catch (err: any) {
      error(err?.message || 'Erreur lors de la gestion du like');
      throw err;
    }
    },
    [error]
  );

  const handleComment = useCallback(
    async (postId: number, _content: string, commentsCount?: number) => {
    if (commentsCount !== undefined) {
      setPosts((prev) =>
        prev.map((post) =>
            post.id === postId
              ? { ...post, comments_count: commentsCount }
              : post
        )
      );
    }
    },
    []
  );

  const handleDeletePost = useCallback(
    (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    success('Post supprimé.');
    },
    [success]
  );
  
  const handleSavePost = useCallback(
    (_postId: number, isSaved: boolean) => {
    if (isSaved) {
      success('Post enregistré');
    } else {
      success('Post retiré des enregistrements');
    }
    },
    [success]
  );

  // Optimisation des posts avec useMemo pour éviter les re-renders inutiles
  const renderedPosts = useMemo(() => {
    return posts.map((post) => (
      <PostCard
        key={`post-${post.id}-${post.updated_at || post.created_at}`}
        post={post}
        onLike={handleLike}
        onComment={handleComment}
        onDelete={handleDeletePost}
        onSave={handleSavePost}
      />
    ));
  }, [posts, handleLike, handleComment, handleDeletePost, handleSavePost]);

  // Optimisation du skeleton loading
  const skeletonPosts = useMemo(
    () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
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
    ),
    []
  );

  return (
    <div 
      ref={containerRef}
      className="flex-1 max-w-full md:max-w-2xl xl:max-w-3xl mx-auto px-0 sm:px-2"
      style={{
        // Optimisations CSS pour un scrolling plus smooth
        willChange: 'scroll-position',
        transform: 'translateZ(0)', // Force hardware acceleration
      }}
    >
      <div className="p-4">
        <Stories />
        <CreatePost onPostCreated={handlePostCreated} />
        {loading ? (
          skeletonPosts
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
          <div 
            className="space-y-4"
            style={{
              // Optimisations CSS pour le conteneur des posts
              contain: 'layout style paint',
              willChange: 'scroll-position',
            }}
          >
            {renderedPosts}
            
            {/* Élément de déclenchement optimisé pour l'infinite scroll */}
            {hasMore && (
              <div 
                ref={observerRef}
                className="flex justify-center items-center py-6"
                style={{
                  // Optimisations pour l'élément de déclenchement
                  contain: 'layout',
                  willChange: 'transform',
                }}
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span>Chargement...</span>
                  </div>
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>
            )}
            
            {/* Message de fin optimisé */}
            {!hasMore && posts.length > 0 && (
              <div 
                className="text-center py-8 text-gray-500"
                style={{ contain: 'layout' }}
              >
                <p>Vous avez atteint la fin du feed</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
