import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import ImageLoader from './ImageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import {
  fetchComments,
  addComment,
  type Comment as ApiComment,
  type CommentsPagination,
} from '../api/comments';
import CommentItem from './CommentItem';
import ShareModal from './ShareModal';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

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
  onLike: (
    postId: number,
    action: 'like' | 'unlike',
    type?: string
  ) => Promise<{
    user_liked: boolean;
    user_like_type?: string;
    reactions: Record<string, number>;
  }>;
  onComment: (postId: number, content: string, commentsCount?: number) => void;
  onDelete?: (postId: number) => void;
  onSave?: (postId: number, isSaved: boolean) => void;
}

function PostCard({
  post,
  onLike,
  onComment,
  onDelete,
  onSave,
}: PostCardProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [showInlineComment, setShowInlineComment] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsPagination, setCommentsPagination] =
    useState<CommentsPagination | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsLimit = 10;
  const [showMenu, setShowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(post.user_saved || false);
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showShareModal, setShowShareModal] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const commentsContainerRef = React.useRef<HTMLDivElement>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  // Ajout pour lightbox
  const [showLightbox, setShowLightbox] = useState(false);

  // Synchroniser l'état local avec les props post.user_liked et post.likes_count
  React.useEffect(() => {
    setIsLiked(post.user_liked || false);
    setLikesCount(post.likes_count);
  }, [post.user_liked, post.likes_count]);

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

  // Fermer le panneau de commentaires au clic extérieur
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        commentsContainerRef.current &&
        !commentsContainerRef.current.contains(event.target as Node)
      ) {
        setShowCommentsPanel(false);
        setShowInlineComment(false);
      }
    }
    if (showCommentsPanel || showInlineComment) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommentsPanel, showInlineComment]);

  // Charger les commentaires (panel) - optimisé avec useCallback
  const loadComments = useCallback(
    async (reset = false) => {
      if (loadingComments || loadingMoreComments) return;
      setCommentsError(null);
      if (reset) setLoadingComments(true);
      else setLoadingMoreComments(true);
      try {
        const offset = reset
          ? 0
          : (commentsPagination?.offset || 0) +
            (commentsPagination?.limit || commentsLimit);
        const data = await fetchComments(
          post.id,
          offset,
          commentsLimit,
          user?.id
        );
        setComments((prev) =>
          reset ? data.comments : [...prev, ...data.comments]
        );
        setCommentsPagination(data.pagination);
      } catch (err: unknown) {
        setCommentsError(
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement des commentaires'
        );
      } finally {
        setLoadingComments(false);
        setLoadingMoreComments(false);
      }
    },
    [
      loadingComments,
      loadingMoreComments,
      commentsPagination,
      post.id,
      user?.id,
    ]
  );

  // Ouvrir le panneau de commentaires - optimisé avec useCallback
  const handleOpenCommentsPanel = useCallback(() => {
    setShowCommentsPanel(true);
    setShowInlineComment(false);
    if (comments.length === 0) {
      loadComments(true);
    }
  }, [comments.length, loadComments]);

  // Clic sur "Commenter" (champ inline) - optimisé avec useCallback
  const handleShowInlineComment = useCallback(() => {
    setShowInlineComment(true);
    setShowCommentsPanel(false);
  }, []);

  // Ajout de commentaire (panel ou inline) - optimisé avec useCallback
  const handleAddComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      setIsSubmitting(true);
      try {
        const response = await addComment(post.id, commentText);
        setCommentText('');
        success('Commentaire ajouté !');

        // Mettre à jour le compteur de commentaires du post
        if (response.comments_count !== undefined) {
          // Mettre à jour le post parent via un callback
          onComment?.(post.id, commentText, response.comments_count);
        }

        if (showCommentsPanel) {
          setComments((prev) => [response.comment, ...prev]);
          setCommentsPagination((prev) =>
            prev ? { ...prev, total: prev.total + 1 } : prev
          );
        }
      } catch (err: unknown) {
        error(
          err instanceof Error
            ? err.message
            : "Erreur lors de l'ajout du commentaire"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [commentText, post.id, onComment, showCommentsPanel, success, error]
  );

  // Infinite scroll (panel)
  const commentsScrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = commentsScrollRef.current;
    if (!el || !showCommentsPanel) return;

    const handleScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 10 &&
        commentsPagination?.has_next &&
        !loadingMoreComments
      ) {
        loadComments();
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, [
    showCommentsPanel,
    commentsPagination,
    loadingMoreComments,
    loadComments,
  ]);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const action = isLiked ? 'unlike' : 'like';
      const result = await onLike(post.id, action);
      setIsLiked(result.user_liked);
      setLikesCount(result.reactions.total || 0);
    } catch (err) {
      console.error('Erreur lors du like:', err);
    } finally {
      setLikeLoading(false);
    }
  }, [likeLoading, isLiked, onLike, post.id]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    try {
      await onDelete(post.id);
      setShowConfirm(false);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  }, [onDelete, post.id]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    try {
      await onSave(post.id, !isSaved);
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  }, [onSave, post.id, isSaved]);

  // Optimisation du rendu avec useMemo pour les éléments coûteux
  const postContent = useMemo(
    () => (
      <div className="px-4 py-3">
        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
          {post.contenu}
        </p>
      </div>
    ),
    [post.contenu]
  );

  const postImage = useMemo(
    () =>
      post.image_url && (
        <div className="mb-3">
          <ImageLoader
            src={post.image_url}
            alt="Post content"
            className="w-full h-auto max-h-96 rounded-xl cursor-pointer"
            objectFit="cover"
            spinnerSize="medium"
            onClick={() => setShowLightbox(true)}
          />
        </div>
      ),
    [post.image_url]
  );

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      style={{
        // Optimisations CSS pour un scrolling plus smooth
        contain: 'layout style paint',
        willChange: 'transform',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar
            userId={post.user_id}
            prenom={post.prenom}
            nom={post.nom}
            photo={post.photo_profil}
            size={40}
            className="cursor-pointer"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3
                className="font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => navigate(`/profile/${post.user_id}`)}
              >
                {post.prenom} {post.nom}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{post.created_at_formatted}</span>
              {post.ville && (
                <>
                  <span>·</span>
                  <span>{post.ville}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10"
            >
              {onSave && (
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                >
                  {isSaved ? (
                    <BookmarkX className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  <span>{isSaved ? 'Retirer' : 'Enregistrer'}</span>
                </button>
              )}
              {onDelete && user?.id === post.user_id && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {postContent}
      {postImage}
      {showLightbox &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
            <button
              className="absolute top-4 right-4 text-white text-3xl"
              onClick={() => setShowLightbox(false)}
              aria-label="Fermer"
            >
              &times;
            </button>
            <img
              src={post.image_url}
              alt="Post content"
              className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl"
            />
          </div>,
          document.body
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
              onClick={handleOpenCommentsPanel}
            >
              {post.comments_count} commentaire
              {post.comments_count !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-1 border-t border-gray-100">
        <div className="flex items-center">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center justify-center space-x-2 flex-1 h-10 rounded-lg transition-all duration-200
              ${isLiked ? 'text-red-500' : 'text-gray-600'}
              hover:bg-red-50 hover:text-red-500
              ${likeLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Heart
              className={`h-[18px] w-[18px] transition-all duration-200 ${
                isLiked ? 'fill-current text-red-500' : ''
              }`}
            />
            <span className="font-medium text-[15px]">
              {isLiked ? "J'aime" : "J'aime"}
            </span>
          </button>
          <button
            onClick={handleShowInlineComment}
            className="flex items-center justify-center space-x-2 flex-1 h-10 rounded-lg text-gray-600 transition-colors hover:bg-blue-100 hover:text-blue-600"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="font-medium text-[15px]">Commenter</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center space-x-2 flex-1 h-10 rounded-lg text-gray-600 transition-colors hover:bg-green-100 hover:text-green-600"
          >
            <Share className="h-[18px] w-[18px]" />
            <span className="font-medium text-[15px]">Partager</span>
          </button>
        </div>
      </div>

      {/* Champ de commentaire inline */}
      {showInlineComment && !showCommentsPanel && (
        <div ref={commentsContainerRef}>
          <form
            onSubmit={handleAddComment}
            className="flex space-x-3 mt-2 px-4 pb-2"
          >
            <Avatar
              userId={user?.id}
              prenom={user?.prenom || ''}
              nom={user?.nom || ''}
              photo={user?.photo_profil}
              size={32}
              className="h-8 w-8"
            />
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

      {/* Panneau extensible commentaires */}
      {showCommentsPanel && (
        <div
          ref={commentsContainerRef}
          className="border-t border-gray-100 bg-white"
        >
          <div
            ref={commentsScrollRef}
            className="max-h-80 overflow-y-auto p-4 space-y-3"
          >
            {loadingComments ? (
              <div className="text-center text-gray-400 py-4">
                Chargement...
              </div>
            ) : commentsError ? (
              <div className="text-center text-red-500 py-4">
                {commentsError}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                Aucun commentaire.
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onCommentUpdate={() => {
                    // Recharger les commentaires pour mettre à jour les compteurs
                    loadComments(true);
                  }}
                />
              ))
            )}
            {/* Infinite scroll loader */}
            {loadingMoreComments && (
              <div className="text-center text-gray-400 py-2">
                Chargement...
              </div>
            )}
            {/* Champ d'ajout de commentaire dans le panneau */}
            <form onSubmit={handleAddComment} className="flex space-x-3 mt-2">
              <Avatar
                userId={user?.id}
                prenom={user?.prenom || ''}
                nom={user?.nom || ''}
                photo={user?.photo_profil}
                size={32}
                className="h-8 w-8"
              />
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
        </div>
      )}

      {/* Share Modal */}
      {showShareModal &&
        createPortal(
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            post={post}
          />,
          document.body
        )}
      {/* ConfirmModal pour suppression */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer le post ?"
        message="Cette action est définitive. Voulez-vous vraiment supprimer ce post ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default React.memo(PostCard, (prevProps, nextProps) => {
  // Comparaison personnalisée pour optimiser les re-renders
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count &&
    prevProps.post.user_liked === nextProps.post.user_liked &&
    prevProps.post.user_saved === nextProps.post.user_saved &&
    prevProps.post.contenu === nextProps.post.contenu &&
    prevProps.post.image_url === nextProps.post.image_url &&
    prevProps.post.created_at_formatted === nextProps.post.created_at_formatted
  );
});
