import React, { useState } from 'react';
import { Heart, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { likeComment, addReply, fetchReplies, deleteComment, type Comment, type Reply } from '../api/comments';
import ConfirmModal from './ConfirmModal';

interface CommentItemProps {
  comment: Comment;
  onCommentUpdate?: () => void;
}

export default function CommentItem({ comment, onCommentUpdate }: CommentItemProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(comment.likes_count || 0);
  const [localUserLiked, setLocalUserLiked] = useState(comment.user_liked || false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; isReply: boolean; content: string } | null>(null);

  // Charger les réponses
  const loadReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const data = await fetchReplies(comment.id, 0, 10);
      setReplies(data.replies);
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Erreur lors du chargement des réponses');
    } finally {
      setLoadingReplies(false);
    }
  };

  // Gérer le like/unlike
  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const action = localUserLiked ? 'unlike' : 'like';
      const response = await likeComment(comment.id, action);
      
      setLocalUserLiked(response.user_liked);
      setLocalLikesCount(response.reactions.total);
      
      success(localUserLiked ? 'Like retiré' : 'Commentaire liké !');
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Erreur lors de la gestion du like');
    } finally {
      setLikeLoading(false);
    }
  };

  // Ajouter une réponse
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    setIsSubmittingReply(true);
    try {
      const response = await addReply(comment.id, replyText);
      setReplyText('');
      setShowReplyForm(false);
      setReplies(prev => [response.reply, ...prev]);
      success('Réponse ajoutée !');
      onCommentUpdate?.();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la réponse');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Afficher/masquer les réponses
  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  // Ouvrir le modal de suppression pour le commentaire principal
  const handleDeleteClick = () => {
    setDeleteTarget({
      id: comment.id,
      isReply: false,
      content: comment.contenu
    });
    setShowDeleteModal(true);
  };

  // Ouvrir le modal de suppression pour une réponse
  const handleDeleteReplyClick = (reply: Reply) => {
    setDeleteTarget({
      id: reply.id,
      isReply: true,
      content: reply.contenu
    });
    setShowDeleteModal(true);
  };

  // Supprimer le commentaire/réponse
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteLoading) return;
    
    setDeleteLoading(true);
    try {
      await deleteComment(deleteTarget.id);
      
      if (deleteTarget.isReply) {
        // Mettre à jour la liste des réponses
        setReplies(prev => prev.filter(r => r.id !== deleteTarget.id));
        success('Réponse supprimée !');
      } else {
        // Mettre à jour le commentaire parent
        success('Commentaire supprimé !');
      }
      
      onCommentUpdate?.();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex space-x-3">
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
        
        {/* Actions du commentaire */}
        <div className="flex items-center space-x-4 mt-1 px-3">
          <button 
            onClick={handleLike}
            disabled={likeLoading}
            className={`text-xs flex items-center space-x-1 transition-colors ${
              localUserLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3 h-3 ${localUserLiked ? 'fill-current' : ''}`} />
            <span>{localLikesCount > 0 ? localLikesCount : ''}</span>
          </button>
          
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            Répondre
          </button>
          
          {(comment.replies_count || 0) > 0 && (
            <button 
              onClick={toggleReplies}
              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              {showReplies ? 'Masquer' : `Voir ${comment.replies_count} réponse${comment.replies_count !== 1 ? 's' : ''}`}
            </button>
          )}
          
          <span className="text-xs text-gray-500">{comment.created_at_formatted}</span>
          
          {/* Bouton de suppression (visible uniquement pour le propriétaire) */}
          {user?.id === comment.user_id && (
            <button 
              onClick={handleDeleteClick}
              disabled={deleteLoading}
              className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Supprimer</span>
            </button>
          )}
        </div>

        {/* Formulaire de réponse */}
        {showReplyForm && (
          <form onSubmit={handleAddReply} className="flex space-x-2 mt-2 px-3">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez une réponse..."
              className="flex-1 min-h-0 py-2 px-3 text-sm bg-gray-100 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500"
              disabled={isSubmittingReply}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmittingReply}
              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Réponses */}
        {showReplies && (
          <div className="mt-2 space-y-2">
            {loadingReplies ? (
              <div className="text-xs text-gray-400 px-3">Chargement des réponses...</div>
            ) : replies.length === 0 ? (
              <div className="text-xs text-gray-400 px-3">Aucune réponse</div>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="ml-4 flex space-x-2">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {reply.photo_profil ? (
                      <img
                        src={reply.photo_profil}
                        alt={`${reply.prenom} ${reply.nom}`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      `${reply.prenom.charAt(0)}${reply.nom.charAt(0)}`
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-xl px-2 py-1">
                      <p className="text-xs font-semibold text-gray-900">
                        {reply.prenom} {reply.nom}
                      </p>
                      <p className="text-xs text-gray-800">{reply.contenu}</p>
                    </div>
                    <div className="flex items-center space-x-3 mt-1 px-2">
                      <button className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                        J'aime
                      </button>
                      <span className="text-xs text-gray-500">{reply.created_at_formatted}</span>
                      
                      {/* Bouton de suppression pour les réponses (visible uniquement pour le propriétaire) */}
                      {user?.id === reply.user_id && (
                        <button 
                          onClick={() => handleDeleteReplyClick(reply)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.isReply ? "Supprimer la réponse" : "Supprimer le commentaire"}
        message={
          deleteTarget?.isReply 
            ? `Êtes-vous sûr de vouloir supprimer cette réponse ?\n\n"${deleteTarget.content.substring(0, 50)}${deleteTarget.content.length > 50 ? '...' : ''}"`
            : `Êtes-vous sûr de vouloir supprimer ce commentaire ?\n\n"${deleteTarget?.content.substring(0, 50)}${deleteTarget && deleteTarget.content.length > 50 ? '...' : ''}"\n\nCette action supprimera également toutes les réponses associées.`
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
} 