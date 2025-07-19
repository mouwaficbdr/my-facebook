import { useEffect, useState, useRef, useCallback } from 'react';
import LoadingSection from './LoadingSection';
import Spinner from './Spinner';
import ModernToast from './ModernToast';
import { useToast } from '../hooks/useToast';
import PostCard from './PostCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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
  comments: any[];
}

export default function SavedPosts() {
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
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();

  // Fetch initial
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetch(`${API_BASE}/api/posts/saved.php?page=1&limit=20`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        setFetchError(
          err.message || 'Erreur lors du chargement des posts enregistrés.'
        );
        toast.error(
          err.message || 'Erreur lors du chargement des posts enregistrés.'
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  // Infinite scroll
  const fetchMorePosts = useCallback(() => {
    if (!pagination.has_next || isFetchingMore) return;
    setIsFetchingMore(true);
    fetch(
      `${API_BASE}/api/posts/saved.php?page=${
        pagination.current_page + 1
      }&limit=20`,
      {
        credentials: 'include',
      }
    )
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setPosts((prev) => [...prev, ...data.data.posts]);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        setFetchError(
          err.message || 'Erreur lors du chargement des posts enregistrés.'
        );
        toast.error(
          err.message || 'Erreur lors du chargement des posts enregistrés.'
        );
      })
      .finally(() => setIsFetchingMore(false));
  }, [pagination, isFetchingMore, toast]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px', // Déclenche 200px avant d'atteindre le bas
      }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchMorePosts, loaderRef]);

  if (loading)
    return (
      <LoadingSection
        message="Chargement des posts enregistrés..."
        className="py-8"
      />
    );
  if (fetchError)
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-red-500">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Impossible de charger les posts enregistrés
        </h3>
        <p className="text-gray-500">{fetchError}</p>
      </div>
    );

  return (
    <div className="flex-1 max-w-full md:max-w-2xl xl:max-w-3xl mx-auto px-0 sm:px-2">
      <div className="p-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-yellow-500">🔖</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun post enregistré
            </h3>
            <p className="text-gray-500">
              Vous n'avez encore enregistré aucun post.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <PostCard
                  key={`saved-post-${post.id}-${idx}`}
                  post={{ ...post, user_saved: true }}
                  onLike={() =>
                    Promise.resolve({
                      user_liked: false,
                      user_like_type: undefined,
                      reactions: {},
                    })
                  }
                  onComment={() => {}}
                  onSave={async (_postId, isSaved) => {
                    if (!isSaved) {
                      try {
                        const res = await fetch(
                          `${API_BASE}/api/posts/save.php`,
                          {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ post_id: post.id }),
                          }
                        );
                        const data = await res.json();
                        if (!data.success) throw new Error(data.message);
                        setPosts((prev) =>
                          prev.filter((p) => p.id !== post.id)
                        );
                        toast.success('Post retiré des enregistrements');
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : 'Erreur lors du retrait'
                        );
                      }
                    }
                  }}
                />
              ))}
            </div>
            {pagination.has_next && (
              <div ref={loaderRef} className="text-center py-8">
                {isFetchingMore && <Spinner size="large" />}
              </div>
            )}
          </>
        )}
        <ModernToast toasts={toast.toasts} onRemove={toast.removeToast} />
      </div>
    </div>
  );
}
