import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Send,
  Bookmark,
  BookmarkX,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

interface Comment {
  id: number;
  contenu: string;
  created_at_formatted: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
}

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
  user_saved?: boolean;
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  onLike: (postId: number, action: 'like' | 'unlike', type?: string) => void;
  onComment: (postId: number, content: string) => void;
  onDelete?: (postId: number) => void;
  onSave?: (postId: number, isSaved: boolean) => void;
}

export default function PostCard({
  post,
  onLike,
  onComment,
  onDelete,
  onSave,
}: PostCardProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(post.user_saved || false);
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLike = () => {
    // Déclencher l'animation
    setLikeAnimation(true);

    // Mettre à jour l'état local immédiatement pour une réponse instantanée
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    // Mettre à jour le compteur local
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    // Appeler le callback parent
    const action = isLiked ? 'unlike' : 'like';
    onLike(post.id, action);

    // Arrêter l'animation après 300ms
    setTimeout(() => {
      setLikeAnimation(false);
    }, 300);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await onComment(post.id, commentText);
      setCommentText('');
      success('Commentaire ajouté !');
    } catch (err: any) {
      error(err?.message || "Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler suppression
  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce post ? Cette action est définitive.'))
      return;
    try {
      const res = await fetch('/api/posts/delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      success(data.message || 'Post supprimé.');
      onDelete?.(post.id);
    } catch (err: any) {
      error(err.message || 'Erreur lors de la suppression.');
    }
  };
  // Handler sauvegarde
  const handleSave = async () => {
    try {
      const res = await fetch('/api/posts/save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Mettre à jour l'état local
      setIsSaved(!isSaved);

      // Appeler le callback parent (qui gère les toasts)
      onSave?.(post.id, !isSaved);
    } catch (err: any) {
      error(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-4 border-0">
      {/* Post Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
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
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-gray-900 truncate">
                  {post.prenom} {post.nom}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {post.created_at_formatted}
                </p>
              </div>
              <div className="relative ml-2 flex-shrink-0">
                <button
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  onClick={() => setShowMenu((v) => !v)}
                  aria-label="Options du post"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </button>
                {showMenu && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-10 z-30 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-2 flex flex-col animate-fade-in"
                  >
                    {user?.id === post.user_id && (
                      <button
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium w-full text-left"
                        onClick={() => {
                          setShowMenu(false);
                          handleDelete();
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Supprimer le post
                      </button>
                    )}
                    <button
                      className={`flex items-center gap-2 px-4 py-2 transition-colors text-sm font-medium w-full text-left ${
                        isSaved
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-blue-700 hover:bg-blue-50'
                      }`}
                      onClick={() => {
                        setShowMenu(false);
                        handleSave();
                      }}
                    >
                      {isSaved ? (
                        <BookmarkX className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                      {isSaved ? 'Retirer' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 text-[16px] leading-relaxed whitespace-pre-wrap">
          {post.contenu}
        </p>
      </div>
      {/* Post Image */}
      {post.image_url && (
        <div className="mb-3">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full h-auto max-h-96 object-cover rounded-xl"
          />
        </div>
      )}
      {/* Engagement Stats */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-[13px] text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <div className="w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                <Heart className="w-[10px] h-[10px] text-white fill-current" />
              </div>
              <span className="font-medium">{likesCount}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="hover:underline"
              onClick={() => setShowComments(!showComments)}
            >
              {post.comments_count} commentaire
              {post.comments_count !== 1 ? 's' : ''}
            </button>
            <button className="hover:underline">0 partage</button>{' '}
            {/* TODO: Implémenter la fonctionnalité de partage */}
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="px-4 py-1 border-t border-gray-100">
        <div className="flex items-center">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center space-x-2 flex-1 h-10 rounded-lg transition-all duration-200
              ${isLiked ? 'text-red-500' : 'text-gray-600'}
              hover:bg-red-50 hover:text-red-500`}
          >
            <Heart
              className={`h-[18px] w-[18px] transition-all duration-200 ${
                isLiked ? 'fill-current text-red-500' : ''
              } ${likeAnimation ? 'scale-125' : ''}`}
            />
            <span className="font-medium text-[15px]">
              {isLiked ? "J'aime" : "J'aime"}
            </span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center space-x-2 flex-1 h-10 rounded-lg text-gray-600 transition-colors hover:bg-blue-100 hover:text-blue-600"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="font-medium text-[15px]">Commenter</span>
          </button>
          <button className="flex items-center justify-center space-x-2 flex-1 h-10 rounded-lg text-gray-600 transition-colors hover:bg-green-100 hover:text-green-600">
            <Share className="h-[18px] w-[18px]" />
            <span className="font-medium text-[15px]">Partager</span>
          </button>
        </div>
      </div>
      {/* Comments Section */}
      {showComments && (
        <div className="p-4 space-y-3 border-t border-gray-100">
          {/* Existing Comments */}
          {post.comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                {comment.photo_profil ? (
                  <img
                    src={comment.photo_profil}
                    alt={`${comment.prenom} ${comment.nom}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  `${comment.prenom.charAt(0)}${comment.nom.charAt(0)}`
                )}
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {comment.prenom} {comment.nom}
                  </p>
                  <p className="text-sm text-gray-800">{comment.contenu}</p>
                </div>
                <div className="flex items-center space-x-4 mt-1 px-3">
                  <button className="text-xs text-gray-500 hover:underline">
                    J'aime
                  </button>
                  <button className="text-xs text-gray-500 hover:underline">
                    Répondre
                  </button>
                  <span className="text-xs text-gray-500">
                    {comment.created_at_formatted}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {/* Add Comment */}
          <form onSubmit={handleComment} className="flex space-x-3 mt-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {user?.prenom?.[0]}
              {user?.nom?.[0]}
            </div>
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="flex-1 min-h-0 py-2 px-3 text-sm bg-gray-100 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
