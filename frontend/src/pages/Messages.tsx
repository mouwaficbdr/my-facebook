import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  searchFriendsForChat,
  type Conversation,
  type Message,
} from '../api/messages';
import {
  Search,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Phone,
  Video,
  Info,
  UserPlus,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import LeftSidebar from '../components/LeftSidebar';
import EmojiPicker from '../components/EmojiPicker';
import MessageBubble from '../components/MessageBubble';
import { cn } from '../utils/cn';

export default function Messages() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États principaux
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');

  // États de chargement
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // États de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // États UI
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  // States pour la sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messagesBadge, setMessagesBadge] = useState(0);
  // Variable notificationsBadge supprimée car non utilisée

  const handleBadgesUpdate = (messages: number, _notifications: number) => {
    setMessagesBadge(messages);
    // setNotificationsBadge(notifications); // Supprimé car non utilisé
  };

  const handleSectionChange = (section: string) => {
    setSidebarOpen(false); // Fermer la sidebar
    switch (section) {
      case 'feed':
        navigate('/home');
        break;
      case 'friends':
        navigate('/home?section=friends');
        break;
      case 'saved':
        navigate('/home?section=saved');
        break;
      case 'reels':
        navigate('/home?section=reels');
        break;
      case 'groupes':
        navigate('/home?section=groupes');
        break;
      case 'pages':
        navigate('/home?section=pages');
        break;
      case 'evenements':
        navigate('/home?section=evenements');
        break;
      default:
        break;
    }
  };

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling pour les nouveaux messages
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();

    // Si un paramètre user=ID est présent dans l'URL, sélectionner la conversation correspondante
    const userIdParam = searchParams.get('user');
    if (userIdParam) {
      const userId = parseInt(userIdParam, 10);

      // Fonction pour charger les infos du profil si nécessaire
      const loadProfileInfo = async (friendId: number) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/profile.php?id=${friendId}`,
            {
              credentials: 'include',
            }
          );
          const data = await response.json();
          // Compatibilité : profile ou user
          const profile = data.data?.profile || data.data?.user;
          if (data.success && profile) {
            return {
              friend_id: friendId,
              nom: profile.nom,
              prenom: profile.prenom,
              photo_profil: profile.photo_profil,
              last_message: '',
              last_message_time: '',
              last_message_formatted: '',
              last_sender_id: 0,
              unread_count: 0,
            };
          }
        } catch (err) {
          console.error('Erreur lors de la récupération du profil:', err);
        }
        return null;
      };

      // Attendre le chargement des conversations pour sélectionner
      setTimeout(async () => {
        setSelectedConversation((prev) => {
          // Si déjà sélectionné, ne rien faire
          if (prev && prev.friend_id === userId) return prev;
          // Chercher la conversation existante
          const conv = conversations.find((c) => c.friend_id === userId);
          if (conv) return conv;

          // Sinon, essayer de charger les infos du profil
          loadProfileInfo(userId).then((profileInfo) => {
            if (profileInfo) {
              setSelectedConversation(profileInfo);
            } else {
              // Fallback: créer une conversation temporaire
              setSelectedConversation({
                friend_id: userId,
                nom: '',
                prenom: '',
                photo_profil: null,
                last_message: '',
                last_message_time: '',
                last_message_formatted: '',
                last_sender_id: 0,
                unread_count: 0,
              });
            }
          });

          return prev; // Retourner l'état actuel pendant le chargement
        });
      }, 500);
    }

    // Polling toutes les 3 secondes pour les nouveaux messages
    pollingRef.current = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.friend_id, true);
      }
      loadConversations();
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.friend_id);
      setShowMobileChat(true);
    }
  }, [selectedConversation]);

  // Compléter dynamiquement les infos du correspondant si elles sont manquantes
  useEffect(() => {
    if (
      selectedConversation &&
      (!selectedConversation.nom || !selectedConversation.prenom)
    ) {
      // Chercher dans la liste des conversations
      const conv = conversations.find(
        (c) => c.friend_id === selectedConversation.friend_id
      );
      if (conv) {
        setSelectedConversation((prev) =>
          prev && prev.friend_id === conv.friend_id ? conv : prev
        );
      } else {
        // Sinon, chercher via l'API de recherche d'amis
        const loadFriendInfo = async () => {
          try {
            const results = await searchFriendsForChat('');
            const friend = results.find(
              (f: any) => f.id === selectedConversation.friend_id
            );
            if (friend) {
              setSelectedConversation((prev) =>
                prev && prev.friend_id === friend.id
                  ? {
                      ...prev,
                      nom: friend.nom,
                      prenom: friend.prenom,
                      photo_profil: friend.photo_profil,
                    }
                  : prev
              );
            } else {
              // Si pas trouvé dans les amis, essayer de récupérer les infos via l'API de profil
              try {
                const response = await fetch(
                  `${
                    import.meta.env.VITE_API_BASE_URL
                  }/api/users/profile.php?id=${selectedConversation.friend_id}`,
                  {
                    credentials: 'include',
                  }
                );
                const data = await response.json();
                // Compatibilité : profile ou user
                const profile = data.data?.profile || data.data?.user;
                if (data.success && profile) {
                  setSelectedConversation((prev) =>
                    prev && prev.friend_id === selectedConversation.friend_id
                      ? {
                          ...prev,
                          nom: profile.nom,
                          prenom: profile.prenom,
                          photo_profil: profile.photo_profil,
                        }
                      : prev
                  );
                }
              } catch (profileErr) {
                console.error(
                  'Erreur lors de la récupération du profil:',
                  profileErr
                );
              }
            }
          } catch (err) {
            console.error("Erreur lors de la recherche d'amis:", err);
          }
        };

        loadFriendInfo();
      }
    }
  }, [selectedConversation, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data.conversations);
    } catch (err: any) {
      error(err.message || 'Erreur lors du chargement des conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (friendId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const data = await fetchMessages(friendId);
      setMessages(data.messages);
    } catch (err: any) {
      if (!silent)
        error(err.message || 'Erreur lors du chargement des messages');
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    const tempMessage = messageText;
    setMessageText('');

    try {
      const data = await sendMessage(
        selectedConversation.friend_id,
        tempMessage
      );
      setMessages((prev) => [...prev, data.message]);

      // Mettre à jour la conversation dans la liste
      setConversations((prev) =>
        prev.map((conv) =>
          conv.friend_id === selectedConversation.friend_id
            ? {
                ...conv,
                last_message: tempMessage,
                last_message_time: data.message.created_at,
                last_message_formatted: data.message.created_at_formatted,
                last_sender_id: user?.id || 0,
                unread_count: 0,
              }
            : conv
        )
      );
    } catch (err: any) {
      error(err.message || "Erreur lors de l'envoi du message");
      setMessageText(tempMessage); // Restaurer le message en cas d'erreur
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchFriendsForChat(query);
      setSearchResults(results);
    } catch (err: any) {
      error(err.message || 'Erreur lors de la recherche');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce la recherche
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const startNewConversation = (friend: any) => {
    const newConv: Conversation = {
      friend_id: friend.id,
      nom: friend.nom,
      prenom: friend.prenom,
      photo_profil: friend.photo_profil,
      last_message: '',
      last_message_time: '',
      last_message_formatted: '',
      last_sender_id: 0,
      unread_count: 0,
    };

    setSelectedConversation(newConv);
    setMessages([]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    messageInputRef.current?.focus();
    adjustTextareaHeight();
  };

  // Auto-resize du textarea
  const adjustTextareaHeight = () => {
    const textarea = messageInputRef.current;
    if (textarea) {
      textarea.style.height = '44px';
      const scrollHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  // Ajuster la hauteur quand le texte change
  useEffect(() => {
    adjustTextareaHeight();
  }, [messageText]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      error('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB max
      error("L'image est trop volumineuse (max 5MB)");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/messages/upload.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'upload");
      }

      // Envoyer le message avec l'image
      if (selectedConversation) {
        const messageData = await sendMessage(
          selectedConversation.friend_id,
          data.data.url,
          'image'
        );
        setMessages((prev) => [...prev, messageData.message]);

        // Mettre à jour la conversation
        setConversations((prev) =>
          prev.map((conv) =>
            conv.friend_id === selectedConversation.friend_id
              ? {
                  ...conv,
                  last_message: '📷 Image',
                  last_message_time: messageData.message.created_at,
                  last_message_formatted:
                    messageData.message.created_at_formatted,
                  last_sender_id: user?.id || 0,
                  unread_count: 0,
                }
              : conv
          )
        );
      }

      success('Image envoyée !');
    } catch (err: any) {
      error(err.message || "Erreur lors de l'envoi de l'image");
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleMessageDeleted = (messageId: number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleProfileClick = () => {
    if (selectedConversation) {
      if (user?.id === selectedConversation.friend_id) {
        navigate('/me');
      } else {
        navigate(`/profile/${selectedConversation.friend_id}`);
      }
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex flex-col">
      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        onBadgesUpdate={handleBadgesUpdate}
      />
      {/* Mobile sidebar - visible seulement sur mobile */}
      <div className="lg:hidden">
        <LeftSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSectionChange={handleSectionChange}
          messagesBadge={messagesBadge}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar des conversations */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl',
            showMobileChat && 'hidden md:flex'
          )}
        >
          {/* Header sidebar */}
          <div className="p-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-3 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-105"
              >
                <Search className="w-5 h-5 text-blue-600" />
              </button>
            </div>

            {/* Barre de recherche */}
            {showSearch && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Rechercher un ami..."
                  className="w-full px-4 py-3 bg-gray-50/80 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all backdrop-blur-sm"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-3.5">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Résultats de recherche */}
          {showSearch && searchResults.length > 0 && (
            <div className="border-b border-gray-200/50 max-h-48 overflow-y-auto bg-white/30 backdrop-blur-sm">
              {searchResults.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => startNewConversation(friend)}
                  className="w-full p-4 hover:bg-blue-50/50 flex items-center space-x-3 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Avatar
                    userId={friend.id}
                    prenom={friend.prenom}
                    nom={friend.nom}
                    photo={friend.photo_profil}
                    size={40}
                    className="ring-2 ring-white shadow-sm"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {friend.prenom} {friend.nom}
                    </p>
                  </div>
                  <UserPlus className="w-4 h-4 text-blue-500" />
                </button>
              ))}
            </div>
          )}

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 animate-pulse"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-blue-500" />
                </div>
                <p className="font-medium">Aucune conversation</p>
                <p className="text-sm mt-1">Recherchez un ami pour commencer</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.friend_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    'w-full p-4 hover:bg-blue-50/50 flex items-center space-x-3 transition-all duration-200 border-l-4 hover:scale-[1.02]',
                    selectedConversation?.friend_id === conv.friend_id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50/30 border-blue-500 shadow-sm'
                      : 'border-transparent'
                  )}
                >
                  <div className="relative">
                    <Avatar
                      userId={conv.friend_id}
                      prenom={conv.prenom}
                      nom={conv.nom}
                      photo={conv.photo_profil}
                      size={48}
                      className="ring-2 ring-white shadow-sm"
                    />
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 truncate">
                        {conv.prenom} {conv.nom}
                      </p>
                      <span className="text-xs text-gray-500 font-medium">
                        {conv.last_message_formatted}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.last_sender_id === user?.id ? 'Vous: ' : ''}
                      {conv.last_message || 'Nouvelle conversation'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone de conversation principale */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-gray-100',
            !showMobileChat && 'hidden md:flex'
          )}
        >
          {selectedConversation ? (
            <>
              {/* Header conversation */}
              <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/80 backdrop-blur-xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-3 hover:bg-blue-50/50 rounded-xl p-2 transition-all duration-200 hover:scale-105"
                  >
                    <Avatar
                      userId={selectedConversation.friend_id}
                      prenom={selectedConversation.prenom}
                      nom={selectedConversation.nom}
                      photo={selectedConversation.photo_profil}
                      size={40}
                      className="ring-2 ring-white shadow-sm"
                    />
                    <div className="text-left">
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.prenom} {selectedConversation.nom}
                      </h2>
                    </div>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="hidden md:block p-3 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-105">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </button>
                  <button className="hidden md:block p-3 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-105">
                    <Video className="w-5 h-5 text-blue-600" />
                  </button>
                  <button className="hidden md:block p-3 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-105">
                    <Info className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-blue-50/10">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // Vérifier si on doit afficher l'avatar (premier message d'une série du même expéditeur)
                    const showAvatar =
                      index === 0 ||
                      messages[index - 1].sender_id !== message.sender_id;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        showAvatar={showAvatar}
                        onMessageDeleted={handleMessageDeleted}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-xl">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end space-x-3"
                >
                  <div className="flex items-center w-full gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image-upload"
                      className={cn(
                        'p-3 rounded-full transition-all duration-200 cursor-pointer hover:scale-110',
                        uploadingImage && 'opacity-50 cursor-not-allowed'
                      )}
                      title="Envoyer une image"
                      style={{ marginBottom: 2 }}
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ImageIcon className="w-6 h-6 text-blue-600" />
                      )}
                    </label>
                    <div className="flex-1 relative flex items-center">
                      <textarea
                        ref={messageInputRef}
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          if (messageInputRef.current) {
                            messageInputRef.current.style.height = 'auto';
                            messageInputRef.current.style.height =
                              messageInputRef.current.scrollHeight + 'px';
                          }
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="Écrivez votre message..."
                        className="w-full px-5 py-3 pr-12 bg-white border-2 border-blue-100 rounded-3xl shadow focus:bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all duration-200 resize-none text-sm md:text-base placeholder:text-gray-400 placeholder:font-semibold align-middle"
                        rows={1}
                        style={{
                          minHeight: '48px',
                          maxHeight: '120px',
                          overflow: 'hidden',
                        }}
                        disabled={sendingMessage}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        <EmojiPicker
                          onEmojiSelect={handleEmojiSelect}
                          className="text-yellow-600"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!messageText.trim() || sendingMessage}
                    className="p-3 rounded-full transition-all duration-200 hover:bg-gray-100 focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-6 h-6 text-blue-600" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Search className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-500">
                  Choisissez une conversation existante ou recherchez un ami
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
