import PostCard from './PostCard';

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

interface PostGridProps {
  posts: Post[];
  title?: string;
  onDeletePost?: (postId: number) => void;
  onSavePost?: (postId: number) => void;
}

export default function PostGrid({
  posts,
  title = 'Publications',
  onDeletePost,
  onSavePost,
}: PostGridProps) {
  return (
    <section className="w-full">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>
      {posts.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          Aucun post à afficher.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-blue-50/90 backdrop-blur-md rounded-2xl shadow-md border border-blue-100 p-0"
            >
              <PostCard
                post={post}
                onLike={() => {}}
                onComment={() => {}}
                onDelete={onDeletePost}
                onSave={onSavePost}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
