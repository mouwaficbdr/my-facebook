// api/feed.ts - Fonctions API pour le feed et les posts

export interface Post {
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

export interface Comment {
  id: number;
  contenu: string;
  created_at_formatted: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
}

export interface FeedResponse {
  posts: Post[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CreatePostData {
  contenu: string;
  type: 'text' | 'image' | 'video';
  image_url?: string;
  is_public?: boolean;
}

export interface LikeResponse {
  post_id: number;
  action: string;
  user_liked: boolean;
  user_like_type?: string;
  reactions: Record<string, number>;
}

// Récupération du feed d'actualités
export const getFeed = async (
  page: number = 1,
  limit: number = 10
): Promise<FeedResponse> => {
  const response = await fetch(`/api/feed.php?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Erreur lors du chargement du feed');
  }

  return data.data;
};

// Création d'un nouveau post
export const createPost = async (postData: CreatePostData): Promise<Post> => {
  const response = await fetch('/api/posts/create.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(postData),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Erreur lors de la création du post');
  }

  return data.data;
};

// Like/unlike d'un post
export const toggleLike = async (
  postId: number,
  action: 'like' | 'unlike',
  type: string = 'like'
): Promise<LikeResponse> => {
  const response = await fetch('/api/posts/like.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      post_id: postId,
      action,
      type,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Erreur lors de la gestion du like');
  }

  return data.data;
};

// Ajout d'un commentaire (à implémenter)
export const addComment = async (): // postId: number,
// content: string
Promise<Comment> => {
  // TODO: Implémenter l'endpoint de commentaires
  throw new Error('Fonctionnalité de commentaires à implémenter');
};
