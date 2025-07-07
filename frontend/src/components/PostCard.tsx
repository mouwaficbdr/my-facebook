import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Send,
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
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  onLike: (postId: number, action: 'like' | 'unlike', type?: string) => void;
  onComment: (postId: number, content: string) => void;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = () => {
    const action = post.user_liked ? 'unlike' : 'like';
    onLike(post.id, action);
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
              <button className="h-8 w-8 p-0 ml-2 flex-shrink-0 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">
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
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-[13px] text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <div className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
                <Heart className="w-[10px] h-[10px] text-white fill-current" />
              </div>
              <span className="font-medium">{post.likes_count}</span>
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
            <button className="hover:underline">0 partage</button> {/* TODO: Implémenter la fonctionnalité de partage */}
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="px-4 py-1">
        <div className="flex items-center">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center space-x-2 flex-1 h-10 hover:bg-gray-100 rounded-lg transition-colors ${
              post.user_liked ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <Heart
              className={`h-[18px] w-[18px] ${
                post.user_liked ? 'fill-current' : ''
              }`}
            />
            <span className="font-medium text-[15px]">J'aime</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center space-x-2 flex-1 h-10 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span className="font-medium text-[15px]">Commenter</span>
          </button>
          <button className="flex items-center justify-center space-x-2 flex-1 h-10 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
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
