// api/comments.ts - Fonctions API pour les commentaires de posts

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface Comment {
  id: number;
  contenu: string;
  created_at: string;
  created_at_formatted: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  parent_id?: number | null;
  likes_count?: number;
  replies_count?: number;
  user_liked?: boolean;
}

export interface Reply extends Comment {
  parent_id: number;
}

export interface CommentsPagination {
  offset: number;
  limit: number;
  total: number;
  has_next: boolean;
}

export interface CommentsListResponse {
  comments: Comment[];
  pagination: CommentsPagination;
}

// Récupérer les commentaires d’un post (paginé)
export async function fetchComments(postId: number, offset = 0, limit = 10, userId?: number): Promise<CommentsListResponse> {
  const params = new URLSearchParams({
    post_id: postId.toString(),
    offset: offset.toString(),
    limit: limit.toString(),
  });
  
  if (userId) {
    params.append('user_id', userId.toString());
  }

  const res = await fetch(`${API_BASE}/api/posts/comments/list.php?${params}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors du chargement des commentaires');
  }
  return data.data;
}

// Ajouter un commentaire à un post
export async function addComment(postId: number, contenu: string): Promise<{comment: Comment, post_id: number, comments_count: number}> {
  const res = await fetch(`${API_BASE}/api/posts/comments/create.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ post_id: postId, contenu }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de l\'ajout du commentaire');
  }
  return data.data;
}

// Liker/unliker un commentaire
export async function likeComment(commentId: number, action: 'like' | 'unlike', type: string = 'like'): Promise<{
  comment_id: number;
  action: string;
  user_liked: boolean;
  user_like_type?: string;
  reactions: Record<string, number>;
}> {
  const res = await fetch(`${API_BASE}/api/comments/like.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ comment_id: commentId, action, type }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Erreur lors de la gestion du like');
  }
  return data.data;
}

// Ajouter une réponse à un commentaire
export async function addReply(parentCommentId: number, contenu: string): Promise<{
  reply: Reply;
  parent_comment_id: number;
  post_id: number;
  comments_count: number;
  replies_count: number;
}> {
  const res = await fetch(`${API_BASE}/api/comments/reply.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ parent_comment_id: parentCommentId, contenu }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de l\'ajout de la réponse');
  }
  return data.data;
}

// Récupérer les réponses d'un commentaire
export async function fetchReplies(commentId: number, offset = 0, limit = 10): Promise<{
  replies: Reply[];
  pagination: CommentsPagination;
}> {
  const params = new URLSearchParams({
    comment_id: commentId.toString(),
    offset: offset.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE}/api/comments/replies.php?${params}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors du chargement des réponses');
  }
  return data.data;
}

// Supprimer un commentaire
export async function deleteComment(commentId: number): Promise<{
  comment_id: number;
  post_id: number;
  comments_count: number;
  replies_count?: number;
  is_reply: boolean;
  parent_comment_id?: number;
}> {
  const res = await fetch(`${API_BASE}/api/comments/delete.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ comment_id: commentId }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erreur lors de la suppression du commentaire');
  }
  return data.data;
} 