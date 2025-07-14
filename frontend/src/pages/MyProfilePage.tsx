import { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  Camera,
  Image as ImageIcon,
  BookOpen,
  Award,
  Pencil,
  MoreHorizontal,
  Check,
  X,
  Trash,
  Globe,
} from 'lucide-react';
import Loading from '../components/Loading';
import ModernToast from '../components/ModernToast';
import { useToast } from '../hooks/useToast';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import ImageUploadButton from '../components/ImageUploadButton';
import { getMediaUrl } from '../utils/cdn';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  bio?: string;
  photo_profil?: string;
  cover_url?: string | null;
  ville?: string;
  pays?: string;
  date_naissance?: string;
  friends_count: number;
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

interface Comment {
  id: number;
  contenu: string;
  created_at_formatted: string;
  user_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
}

interface Friend {
  id: number;
  prenom: string;
  nom: string;
  photo_profil?: string | null;
}

export default function MyProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<
    'posts' | 'about' | 'friends' | 'photos'
  >('posts');
  const toast = useToast();
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Ajout du state pour la pagination des amis
  const [friendsPagination, setFriendsPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const loaderRefFriends = useRef<HTMLDivElement | null>(null);
  const [isFetchingMoreFriends, setIsFetchingMoreFriends] = useState(false);

  // État pour l'édition
  const [editMode, setEditMode] = useState<{
    bio: boolean;
    name: boolean;
    photo: boolean;
    ville: boolean;
    pays: boolean;
    date_naissance: boolean;
  }>({
    bio: false,
    name: false,
    photo: false,
    ville: false,
    pays: false,
    date_naissance: false,
  });
  const [editValues, setEditValues] = useState<{
    bio: string;
    prenom: string;
    nom: string;
    photo_profil?: string;
    ville?: string;
    pays?: string;
    date_naissance?: string;
  }>({ bio: '', prenom: '', nom: '', photo_profil: '' });

  // State pour la preview des images
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // State pour la confirmation de suppression
  const [confirmDelete, setConfirmDelete] = useState<
    'profile' | 'cover' | null
  >(null);

  // State pour le menu de l'avatar
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // State pour le chargement des images
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [coverImageLoading, setCoverImageLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditValues({
        bio: profile.bio || '',
        prenom: profile.prenom,
        nom: profile.nom,
        photo_profil: profile.photo_profil || '',
        ville: profile.ville || '',
        pays: profile.pays || '',
        date_naissance: profile.date_naissance || '',
      });
    }
  }, [profile]);

  // Infinite scroll: charger plus de posts quand on atteint le bas
  const fetchMorePosts = useCallback(() => {
    if (!pagination.has_next || isFetchingMore) return;
    setIsFetchingMore(true);
    fetch(
      `${API_BASE}/api/users/profile.php?id=${user?.id}&page=${
        pagination.current_page + 1
      }&limit=10`,
      { credentials: 'include' }
    )
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setPosts((prev) => [...prev, ...data.data.posts]);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        setFetchError(err.message || 'Erreur lors du chargement des posts.');
        toast.error(err.message || 'Erreur lors du chargement des posts.');
      })
      .finally(() => setIsFetchingMore(false));
  }, [user, pagination, isFetchingMore, toast]);

  // IntersectionObserver pour infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchMorePosts, loaderRef]);

  // Fonction pour refetch le profil utilisateur connecté
  const fetchProfile = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    setFetchError(null);
    fetch(`${API_BASE}/api/users/profile.php?id=${user.id}&page=1&limit=10`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setProfile(data.data.user);
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
        // Met à jour le contexte utilisateur global si c'est le profil connecté
        if (data.data.user && user && data.data.user.id === user.id) {
          updateUser({
            photo_profil: data.data.user.photo_profil,
            nom: data.data.user.nom,
            prenom: data.data.user.prenom,
            // Ajoute d'autres champs si besoin
          });
        }
      })
      .catch((err) => {
        setFetchError(err.message || 'Erreur lors du chargement du profil.');
        toast.error(err.message || 'Erreur lors du chargement du profil.');
      })
      .finally(() => setLoading(false));
  }, [user, toast, updateUser]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setFetchError(null);
    fetch(`${API_BASE}/api/users/profile.php?id=${user.id}&page=1&limit=10`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setProfile(data.data.user);
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      })
      .catch((err) => {
        setFetchError(err.message || 'Erreur lors du chargement du profil.');
        toast.error(err.message || 'Erreur lors du chargement du profil.');
      })
      .finally(() => setLoading(false));
  }, [user, toast]);

  // Fonction pour formater les dates en français
  const formatDateFr = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handlers édition
  const handleEdit = (field: keyof typeof editMode) =>
    setEditMode({ ...editMode, [field]: true });
  const handleCancel = (field: keyof typeof editMode) =>
    setEditMode({ ...editMode, [field]: false });
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditValues({ ...editValues, [name]: value });
  };
  const handleSave = async (field: keyof typeof editMode) => {
    try {
      const payload: any = {};
      payload[field] = editValues[field];
      const res = await fetch(`${API_BASE}/api/users/me_update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProfile((prev) =>
        prev ? { ...prev, [field]: editValues[field] } : prev
      );
      setEditMode({ ...editMode, [field]: false });
      toast.success('Modifié !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Fonction pour fetch les amis (à adapter selon l’API existante)
  const fetchFriends = useCallback((userId: number, page = 1, perPage = 20) => {
    return fetch(
      `${API_BASE}/api/friends/list.php?id=${userId}&page=${page}&limit=${perPage}`,
      { credentials: 'include' }
    ).then(async (res) => {
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { friends: data.friends, pagination: data.pagination };
    });
  }, []);

  // Chargement initial des amis (première page)
  useEffect(() => {
    if (!profile) return;
    setFriends([]);
    setFriendsPagination({
      current_page: 1,
      per_page: 20,
      total: 0,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    });
    fetchFriends(profile.id, 1, 20)
      .then(({ friends, pagination }) => {
        setFriends(friends);
        setFriendsPagination(pagination);
      })
      .catch((err) =>
        toast.error(err.message || 'Erreur lors du chargement des amis.')
      );
  }, [profile, toast, fetchFriends]);

  // Fonction pour charger plus d'amis au scroll
  const fetchMoreFriends = useCallback(() => {
    if (!profile || !friendsPagination.has_next || isFetchingMoreFriends)
      return;
    setIsFetchingMoreFriends(true);
    fetchFriends(
      profile.id,
      friendsPagination.current_page + 1,
      friendsPagination.per_page
    )
      .then(({ friends: newFriends, pagination }) => {
        setFriends((prev) => [...prev, ...newFriends]);
        setFriendsPagination(pagination);
      })
      .catch((err) =>
        toast.error(err.message || 'Erreur lors du chargement des amis.')
      )
      .finally(() => setIsFetchingMoreFriends(false));
  }, [profile, friendsPagination, isFetchingMoreFriends, fetchFriends, toast]);

  // IntersectionObserver pour infinite scroll amis
  useEffect(() => {
    if (activeTab !== 'friends') return;
    if (!loaderRefFriends.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreFriends();
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRefFriends.current);
    return () => observer.disconnect();
  }, [fetchMoreFriends, loaderRefFriends, activeTab]);

  // Ajoute les handlers pour valider/annuler la cover preview
  const handleValidateCover = async () => {
    if (!coverPreview) return;
    setCoverImageLoading(true);
    try {
      const blob = await fetch(coverPreview).then((r) => r.blob());
      const file = new File([blob], 'cover.jpg', { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload/cover.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProfile((prev) => (prev ? { ...prev, cover_url: data.url } : prev));
      setCoverPreview(null);
      toast.success('Image de couverture mise à jour !');
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’upload');
      setCoverPreview(null);
    } finally {
      setCoverImageLoading(false);
    }
  };
  const handleCancelCover = () => {
    setCoverPreview(null);
  };

  // Handler suppression profil
  const handleDeleteProfile = () => setConfirmDelete('profile');
  const confirmDeleteProfile = async () => {
    setProfileImageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/upload/profile_delete.php`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      fetchProfile();
      toast.success('Photo de profil supprimée !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setProfileImageLoading(false);
    }
  };
  // Handler suppression cover
  const handleDeleteCover = () => setConfirmDelete('cover');
  const confirmDeleteCover = async () => {
    setCoverImageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/upload/cover_delete.php`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      fetchProfile();
      toast.success('Cover supprimée !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setCoverImageLoading(false);
    }
  };

  // Handler validation photo de profil
  const handleValidateProfile = async () => {
    if (!profilePreview) return;
    setProfileImageLoading(true);
    try {
      const blob = await fetch(profilePreview).then((r) => r.blob());
      const file = new File([blob], 'profile.jpg', { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/upload/profile.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      fetchProfile();
      setProfilePreview(null);
      toast.success('Photo de profil mise à jour !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’upload');
      setProfilePreview(null);
    } finally {
      setProfileImageLoading(false);
    }
  };
  const handleCancelProfile = () => {
    setProfilePreview(null);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  if (loading) return <Loading />;
  if (fetchError) return <ModernToast type="error" message={fetchError} />;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header Cover avec design pleine largeur */}
      <div className="relative">
        {/* Cover Image ou fallback dégradé avec preview */}
        {coverPreview ? (
          <div className="h-80 lg:h-96 relative overflow-hidden">
            <img
              src={coverPreview}
              alt="Preview cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* Boutons valider/annuler flottants */}
            <div className="absolute bottom-4 right-4 z-30 flex gap-2">
              <button
                onClick={handleValidateCover}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-700 transition text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Valider
              </button>
              <button
                onClick={handleCancelCover}
                className="bg-white text-gray-700 px-4 py-2 rounded-xl font-semibold shadow hover:bg-gray-200 transition text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Annuler
              </button>
            </div>
            {/* Bouton d'upload simple */}
            <div className="absolute bottom-4 left-4 z-20">
              <ImageUploadButton
                endpoint={`${API_BASE}/api/upload/cover.php`}
                currentImage={''}
                onSuccess={() => {}}
                icon={<Camera className="w-6 h-6 text-white" />}
                size={48}
                label="Changer la couverture"
                className="shadow-lg"
                onPreview={setCoverPreview}
              />
            </div>
          </div>
        ) : profile?.cover_url ? (
          <div className="h-80 lg:h-96 relative overflow-hidden">
            <img
              src={getMediaUrl(profile.cover_url)}
              alt="Photo de couverture"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 z-30">
              <button
                onClick={handleDeleteCover}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-red-600 text-white hover:text-white shadow-lg border border-white/30 transition focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
                title="Supprimer la couverture"
                aria-label="Supprimer la couverture"
                type="button"
              >
                <Trash className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 z-20">
              <ImageUploadButton
                endpoint={`${API_BASE}/api/upload/cover.php`}
                currentImage={''}
                onSuccess={() => fetchProfile()}
                icon={<Camera className="w-6 h-6 text-white" />}
                size={48}
                label="Changer la couverture"
                className="shadow-lg"
                onPreview={setCoverPreview}
              />
            </div>
          </div>
        ) : (
          <div className="h-80 lg:h-96 bg-gradient-to-br from-[#1877F2] via-[#145DB2] to-[#1877F2] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div
              className={
                'absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-50'
              }
            />
            <div className="absolute bottom-4 left-4 z-20">
              <ImageUploadButton
                endpoint={`${API_BASE}/api/upload/cover.php`}
                currentImage={''}
                onSuccess={() => {}}
                icon={<Camera className="w-6 h-6 text-white" />}
                size={48}
                label="Changer la couverture"
                className="shadow-lg"
                onPreview={setCoverPreview}
              />
            </div>
          </div>
        )}
        {/* Profile Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-24 pb-8">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-8 pt-8 pb-0">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 sm:gap-8">
                  {/* Avatar et info principale */}
                  <div className="relative flex-shrink-0">
                    {profilePreview ? (
                      <>
                        <img
                          src={profilePreview}
                          alt="Preview profil"
                          className="object-cover w-[160px] h-[160px] rounded-full border-6 border-white shadow-2xl"
                        />
                        {/* Boutons valider/annuler flottants SUR l'avatar, de part et d'autre, comme l'icône caméra */}
                        <button
                          onClick={handleCancelProfile}
                          aria-label="Annuler la modification de la photo de profil"
                          className="absolute bottom-2 left-2 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 shadow-lg border border-gray-200 hover:bg-red-100 hover:text-red-600 text-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 z-30"
                          type="button"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleValidateProfile}
                          aria-label="Valider la nouvelle photo de profil"
                          className="absolute bottom-2 right-2 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 shadow-lg border border-gray-200 hover:bg-green-100 hover:text-green-600 text-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400 z-30"
                          type="button"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                        {/* Spinner overlay sur l'avatar pendant loading */}
                        {profileImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full z-40">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                          </div>
                        )}
                      </>
                    ) : profile.photo_profil ? (
                      <div className="relative group">
                        <ImageUploadButton
                          endpoint={`${API_BASE}/api/upload/profile.php`}
                          currentImage={getMediaUrl(profile.photo_profil)}
                          onSuccess={() => {
                            fetchProfile();
                            setProfilePreview(null);
                          }}
                          icon={<Camera className="w-5 h-5 text-white" />}
                          size={160}
                          label="Changer la photo de profil"
                          className="border-6 border-white shadow-2xl"
                          onPreview={setProfilePreview}
                          shape="circle"
                        />
                        {/* Bouton menu options */}
                        <div
                          className="absolute bottom-2 right-2 z-10"
                          ref={profileMenuRef}
                        >
                          <button
                            onClick={() => setProfileMenuOpen((v) => !v)}
                            className="bg-white/80 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-full shadow border border-gray-200 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            title="Options photo de profil"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-20 animate-fade-in-up">
                              <button
                                onClick={() => {
                                  setProfileMenuOpen(false);
                                  setProfilePreview('');
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-800 rounded-t-lg text-sm"
                              >
                                Changer
                              </button>
                              <button
                                onClick={() => {
                                  setProfileMenuOpen(false);
                                  handleDeleteProfile();
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-b-lg border-t border-gray-100 text-sm"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <Avatar
                          prenom={profile?.prenom || ''}
                          nom={profile?.nom || ''}
                          photo={getMediaUrl(profile?.photo_profil)}
                          size={160}
                          className="border-6 border-white shadow-2xl"
                        />
                        <div className="absolute bottom-2 right-2">
                          <ImageUploadButton
                            endpoint={`${API_BASE}/api/upload/profile.php`}
                            currentImage={''}
                            onSuccess={() => {
                              fetchProfile();
                              setProfilePreview(null);
                            }}
                            icon={<Camera className="w-5 h-5 text-white" />}
                            size={48}
                            label="Changer la photo de profil"
                            className="shadow-lg"
                            onPreview={setProfilePreview}
                            shape="circle"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    {editMode.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="prenom"
                          value={editValues.prenom}
                          onChange={handleChange}
                          className="border rounded px-2 py-1 text-lg font-bold"
                        />
                        <input
                          type="text"
                          name="nom"
                          value={editValues.nom}
                          onChange={handleChange}
                          className="border rounded px-2 py-1 text-lg font-bold"
                        />
                        <button
                          onClick={() => handleSave('name')}
                          className="ml-2 text-blue-600 font-semibold"
                        >
                          Sauver
                        </button>
                        <button
                          onClick={() => handleCancel('name')}
                          className="ml-1 text-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-0 break-words flex items-center gap-2">
                        {profile?.prenom} {profile?.nom}
                        <button
                          onClick={() => handleEdit('name')}
                          className="ml-2 text-gray-400 hover:text-blue-600"
                          title="Modifier le nom"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </h1>
                    )}
                    {/* Nombre d'amis sous le nom */}
                    <div className="flex items-center gap-2 mt-1 text-gray-700 font-medium text-base flex-wrap">
                      <span>
                        {profile?.friends_count} ami
                        {profile?.friends_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Bio juste après */}
                    {editMode.bio ? (
                      <div className="flex items-center gap-2 mt-2">
                        <textarea
                          name="bio"
                          value={editValues.bio}
                          onChange={handleChange}
                          className="border rounded px-2 py-1 text-lg flex-1"
                        />
                        <button
                          onClick={() => handleSave('bio')}
                          className="ml-2 text-blue-600 font-semibold"
                        >
                          Sauver
                        </button>
                        <button
                          onClick={() => handleCancel('bio')}
                          className="ml-1 text-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <p className="text-lg text-gray-700 leading-relaxed max-w-full sm:max-w-2xl mt-2 break-words flex items-center gap-2">
                        {profile?.bio || (
                          <span className="italic text-gray-400">
                            Aucune bio renseignée.
                          </span>
                        )}
                        <button
                          onClick={() => handleEdit('bio')}
                          className="ml-2 text-gray-400 hover:text-blue-600"
                          title="Modifier la bio"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Onglets navigation avec icônes */}
              <div className="border-t border-gray-100 mt-8">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {[
                    {
                      id: 'posts',
                      label: 'Publications',
                      icon: FileText,
                      color: 'blue',
                    },
                    {
                      id: 'about',
                      label: 'À propos',
                      icon: BookOpen,
                      color: 'emerald',
                    },
                    {
                      id: 'friends',
                      label: 'Amis',
                      icon: Users,
                      color: 'violet',
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const colorClasses = {
                      blue: isActive
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600',
                      emerald: isActive
                        ? 'text-emerald-600 border-emerald-600'
                        : 'text-gray-600 hover:text-emerald-600',
                      violet: isActive
                        ? 'text-violet-600 border-violet-600'
                        : 'text-gray-600 hover:text-violet-600',
                    };
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 font-semibold transition-all duration-300 border-b-3 whitespace-nowrap ${
                          isActive
                            ? `border-${tab.color}-600 text-${tab.color}-600 bg-${tab.color}-50/50`
                            : `border-transparent text-gray-600 hover:text-${tab.color}-600 hover:bg-gray-50`
                        } ${
                          colorClasses[tab.color as keyof typeof colorClasses]
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mt-8">
          {activeTab === 'posts' && (
            <div className="w-full">
              {posts.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucune publication
                  </h3>
                  <p className="text-gray-500">
                    Vous n'avez encore publié aucun contenu.
                  </p>
                </div>
              ) : (
                <>
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6">
                    {posts.map((post, idx) => (
                      <div
                        key={`posts-post-${post.id}-${idx}`}
                        className="break-inside-avoid mb-6 w-full animate-fade-in-up"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="transform hover:scale-[1.02] transition-transform duration-300">
                          <PostCard post={post} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {pagination.has_next && (
                    <div ref={loaderRef} className="text-center py-8">
                      {isFetchingMore && <Loading />}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-emerald-500" />
                  Informations générales
                </h3>
                <div className="space-y-4">
                  {/* Bio éditable */}
                  {editMode.bio ? (
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                      <FileText className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-700 mb-1">
                          Biographie
                        </div>
                        <textarea
                          name="bio"
                          value={editValues.bio}
                          onChange={handleChange}
                          className="border rounded px-2 py-1 text-lg w-full"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleSave('bio')}
                            className="text-blue-600 font-semibold"
                          >
                            Sauver
                          </button>
                          <button
                            onClick={() => handleCancel('bio')}
                            className="text-gray-400"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    profile?.bio && (
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                        <FileText className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 flex flex-col items-start">
                          <div className="text-sm font-semibold text-gray-700 mb-1">
                            Biographie
                          </div>
                          <div className="flex items-center">
                            <span>{profile.bio}</span>
                            <button
                              onClick={() => handleEdit('bio')}
                              className="ml-2 text-gray-400 hover:text-blue-600"
                              title="Modifier la bio"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  {/* Ville éditable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                    <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Ville
                      </div>
                      <div className="flex items-center">
                        {editMode.ville ? (
                          <>
                            <input
                              type="text"
                              name="ville"
                              value={editValues.ville || ''}
                              onChange={handleChange}
                              className="border rounded px-2 py-1 text-lg"
                            />
                            <button
                              onClick={() => handleSave('ville')}
                              className="ml-2 text-blue-600 font-semibold"
                            >
                              Sauver
                            </button>
                            <button
                              onClick={() => handleCancel('ville')}
                              className="ml-1 text-gray-400"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <span>
                              {profile?.ville || (
                                <span className="italic text-gray-400">
                                  Non renseignée
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleEdit('ville')}
                              className="ml-2 text-gray-400 hover:text-blue-600"
                              title="Modifier la ville"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Pays éditable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                    <Globe className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Pays
                      </div>
                      <div className="flex items-center">
                        {editMode.pays ? (
                          <>
                            <input
                              type="text"
                              name="pays"
                              value={editValues.pays || ''}
                              onChange={handleChange}
                              className="border rounded px-2 py-1 text-lg"
                            />
                            <button
                              onClick={() => handleSave('pays')}
                              className="ml-2 text-blue-600 font-semibold"
                            >
                              Sauver
                            </button>
                            <button
                              onClick={() => handleCancel('pays')}
                              className="ml-1 text-gray-400"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <span>
                              {profile?.pays || (
                                <span className="italic text-gray-400">
                                  Non renseigné
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleEdit('pays')}
                              className="ml-2 text-gray-400 hover:text-blue-600"
                              title="Modifier le pays"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Date de naissance éditable */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                    <Calendar className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 flex flex-col items-start">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Date de naissance
                      </div>
                      <div className="flex items-center">
                        {editMode.date_naissance ? (
                          <>
                            <input
                              type="date"
                              name="date_naissance"
                              value={editValues.date_naissance || ''}
                              onChange={handleChange}
                              className="border rounded px-2 py-1 text-lg"
                            />
                            <button
                              onClick={() => handleSave('date_naissance')}
                              className="ml-2 text-blue-600 font-semibold"
                            >
                              Sauver
                            </button>
                            <button
                              onClick={() => handleCancel('date_naissance')}
                              className="ml-1 text-gray-400"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <span>
                              {profile?.date_naissance ? (
                                formatDateFr(profile.date_naissance)
                              ) : (
                                <span className="italic text-gray-400">
                                  Non renseignée
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleEdit('date_naissance')}
                              className="ml-2 text-gray-400 hover:text-blue-600"
                              title="Modifier la date de naissance"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Award className="w-6 h-6 text-yellow-500" />
                  Statistiques
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-6 bg-blue-50 rounded-2xl">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {pagination.total}
                    </div>
                    <div className="text-sm text-gray-600">Publications</div>
                  </div>
                  <div className="text-center p-6 bg-violet-50 rounded-2xl">
                    <div className="text-3xl font-bold text-violet-600 mb-2">
                      {profile?.friends_count ?? friends.length}
                    </div>
                    <div className="text-sm text-gray-600">Amis</div>
                  </div>
                  <div className="text-center p-6 bg-amber-50 rounded-2xl">
                    <div className="text-3xl font-bold text-amber-600 mb-2">
                      0
                    </div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'friends' && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Users className="w-6 h-6 text-violet-500" />
                Amis ({friends.length})
              </h3>
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-violet-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucun ami
                  </h4>
                  <p className="text-gray-500">
                    Vous n'avez pas encore d'amis.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="text-center group cursor-pointer"
                    >
                      <div className="relative mb-3">
                        <Avatar
                          prenom={friend.prenom}
                          nom={friend.nom}
                          photo={friend.photo_profil}
                          size={80}
                          className="mx-auto group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                        {friend.prenom} {friend.nom}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {friendsPagination && friendsPagination.has_next && (
                <div ref={loaderRefFriends} className="text-center py-8">
                  {isFetchingMoreFriends && <Loading />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modale de confirmation suppression */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={
          confirmDelete === 'profile'
            ? confirmDeleteProfile
            : confirmDeleteCover
        }
        title={
          confirmDelete === 'profile'
            ? 'Supprimer la photo de profil ?'
            : 'Supprimer la cover ?'
        }
        message={
          confirmDelete === 'profile'
            ? 'Cette action supprimera définitivement votre photo de profil.'
            : 'Cette action supprimera définitivement votre image de couverture.'
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
}
