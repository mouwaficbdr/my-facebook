
import React, { useState, useEffect, useRef } from 'react';
import { getComments, addComment as apiAddComment } from '../api/feed';
import { Comment } from '../api/feed';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

interface CommentListProps {
  postId: number;
  initialComments: Comment[];
  onCommentAdded: (newComment: Comment) => void;
}

const CommentList: React.FC<CommentListProps> = ({ postId, initialComments, onCommentAdded }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const lastCommentElementRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      // const response = await getComments(postId, page, 5);
      // setComments(prev => [...prev, ...response.comments]);
      // setHasMore(response.pagination.has_next);
      // setPage(prev => prev + 1);
    } catch (err) {
      error('Erreur lors du chargement des commentaires');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchComments();
      }
    });
    if (lastCommentElementRef.current) {
      observer.current.observe(lastCommentElementRef.current);
    }
  }, [lastCommentElementRef, fetchComments]);


  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const newComment = await apiAddComment(postId, commentText);
      setComments(prev => [newComment, ...prev]);
      onCommentAdded(newComment);
      setCommentText('');
      success('Commentaire ajouté !');
    } catch (err: any) {
      error(err?.message || "Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-3 border-t border-gray-100">
      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="flex space-x-3 mt-2">
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

      {/* Existing Comments */}
      {comments.map((comment, index) => {
        const ref = index === comments.length - 1 ? lastCommentElementRef : null;
        return (
          <div key={comment.id} ref={ref} className="flex space-x-3">
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
        );
      })}
      {isLoading && <div className="text-center text-gray-500">Chargement...</div>}
    </div>
  );
};

export default CommentList;
