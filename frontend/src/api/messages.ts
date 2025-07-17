import { API_BASE } from './base';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  contenu: string;
  type: 'text' | 'image';
  is_read: boolean;
  created_at: string;
  created_at_formatted: string;
  is_mine: boolean;
  sender: {
    nom: string;
    prenom: string;
    photo_profil: string | null;
  };
}

export interface Conversation {
  friend_id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  last_message: string;
  last_message_time: string;
  last_message_formatted: string;
  last_sender_id: number;
  unread_count: number;
}

export interface MessagesPagination {
  offset: number;
  limit: number;
  total: number;
  has_next: boolean;
}

// Récupérer les conversations
export async function fetchConversations(): Promise<{
  conversations: Conversation[];
  total: number;
}> {
  const res = await fetch(`${API_BASE}/api/messages/conversations.php`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.message || 'Erreur lors du chargement des conversations'
    );
  }

  return data.data;
}

// Récupérer les messages d'une conversation
export async function fetchMessages(
  friendId: number,
  offset: number = 0,
  limit: number = 20
): Promise<{
  messages: Message[];
  friend: {
    id: number;
    nom: string;
    prenom: string;
    photo_profil: string | null;
  };
  pagination: MessagesPagination;
}> {
  const params = new URLSearchParams({
    friend_id: friendId.toString(),
    offset: offset.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE}/api/messages/list.php?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors du chargement des messages');
  }

  return data.data;
}

// Envoyer un message
export async function sendMessage(
  receiverId: number,
  contenu: string,
  type: 'text' | 'image' = 'text'
): Promise<{
  message: Message;
  receiver: {
    id: number;
    nom: string;
    prenom: string;
  };
}> {
  const res = await fetch(`${API_BASE}/api/messages/send.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      receiver_id: receiverId,
      contenu,
      type,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Erreur lors de l'envoi du message");
  }

  return data.data;
}

// Récupérer le nombre de messages non lus
export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/messages/unread_count.php`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors du comptage des messages');
  }

  return data.data.unread_count;
}

// Supprimer un message
export async function deleteMessage(messageId: number): Promise<{
  message_id: number;
  receiver_id: number;
}> {
  const res = await fetch(`${API_BASE}/api/messages/delete.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      message_id: messageId,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors de la suppression du message');
  }

  return data.data;
}

// Rechercher des amis pour démarrer une conversation
export async function searchFriendsForChat(query: string): Promise<
  {
    id: number;
    nom: string;
    prenom: string;
    photo_profil: string | null;
  }[]
> {
  const params = new URLSearchParams({
    q: query,
    friends_only: '1', // Limiter aux amis uniquement
  });

  const res = await fetch(`${API_BASE}/api/users/search.php?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Erreur lors de la recherche');
  }

  return data.data.users || [];
}
