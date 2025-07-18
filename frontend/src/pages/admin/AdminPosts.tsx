import { useState, useEffect } from 'react';
import { fetchPosts, deletePost } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import {
  FileText,
  Search,
  Trash2,
  Eye,
  Image,
  Video,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import { getMediaUrl } from '../../utils/cdn';
import ConfirmModal from '../../components/ConfirmModal';

interface Post {
  id: number;
  user_id: number;
  contenu: string;
  image_url: string | null;
  type: 'text' | 'image' | 'video';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  nom: string;
  prenom: string;
  email: string;
  photo_profil: string | null;
  likes_count: number;
  comments_count: number;
}

interface PostsData {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminPosts() {
  const { success, error } = useToast();
  const [data, setData] = useState<PostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, [page, search]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await fetchPosts(page, 20, search);
      setData(result);
    } catch (err: any) {
      error(err.message || 'Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete.id);
      success('Post supprimé avec succès');
      loadPosts();
    } catch (err: any) {
      error(err.message || 'Erreur lors de la suppression');
    } finally {
      setShowConfirmModal(false);
      setPostToDelete(null);
    }
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4 text-green-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'image':
        return 'Image';
      case 'video':
        return 'Vidéo';
      default:
        return 'Texte';
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Modération des posts
              </h1>
              <p className="text-gray-600 mt-1">
                {data?.pagination.total || 0} posts au total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans le contenu des posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contenu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        userId={post.user_id}
                        prenom={post.prenom}
                        nom={post.nom}
                        photo={getMediaUrl(post.photo_profil)}
                        size={40}
                        className="mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {post.prenom} {post.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {truncateContent(post.contenu)}
                    </div>
                    {post.image_url && (
                      <div className="mt-2">
                        <img
                          src={getMediaUrl(post.image_url)}
                          alt="Post image"
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(post.type)}
                      <span className="text-sm text-gray-900">
                        {getTypeLabel(post.type)}
                      </span>
                    </div>
                    {!post.is_public && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                        Privé
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <span>{post.comments_count}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(post.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-xs">
                      {new Date(post.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewPost(post)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Voir le détail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setPostToDelete(post);
                          setShowConfirmModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() =>
                  setPage(Math.min(data.pagination.pages, page + 1))
                }
                disabled={page === data.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de{' '}
                  <span className="font-medium">
                    {(page - 1) * data.pagination.limit + 1}
                  </span>{' '}
                  à{' '}
                  <span className="font-medium">
                    {Math.min(
                      page * data.pagination.limit,
                      data.pagination.total
                    )}
                  </span>{' '}
                  sur{' '}
                  <span className="font-medium">{data.pagination.total}</span>{' '}
                  résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPage(Math.min(data.pagination.pages, page + 1))
                    }
                    disabled={page === data.pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détail du post
                </h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Author */}
                <div className="flex items-center space-x-3">
                  <Avatar
                    userId={selectedPost.user_id}
                    prenom={selectedPost.prenom}
                    nom={selectedPost.nom}
                    photo={getMediaUrl(selectedPost.photo_profil)}
                    size={48}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedPost.prenom} {selectedPost.nom}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedPost.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(selectedPost.created_at).toLocaleString(
                        'fr-FR'
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedPost.contenu}
                  </p>
                </div>

                {/* Image */}
                {selectedPost.image_url && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={getMediaUrl(selectedPost.image_url)}
                      alt="Post content"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-gray-600">
                        {selectedPost.likes_count} j'aime
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        {selectedPost.comments_count} commentaires
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(selectedPost.type)}
                    <span className="text-sm text-gray-600">
                      {getTypeLabel(selectedPost.type)}
                    </span>
                    {!selectedPost.is_public && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Privé
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => {
                      handleDeletePost();
                      setShowPostModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Supprimer ce post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeletePost}
        title="Supprimer ce post ?"
        message={
          postToDelete
            ? `Êtes-vous sûr de vouloir supprimer ce post de ${postToDelete.prenom} ${postToDelete.nom} ?`
            : ''
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}
