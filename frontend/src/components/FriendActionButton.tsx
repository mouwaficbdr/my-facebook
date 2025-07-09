import { useState } from 'react';
import { useToast } from '../hooks/useToast';

type FriendStatus =
  | 'self'
  | 'not_friends'
  | 'request_sent'
  | 'request_received'
  | 'friends';

interface Props {
  userId: number;
  status: FriendStatus;
  onStatusChange: (status: FriendStatus) => void;
}

export default function FriendActionButton({
  userId,
  status,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAction = async (
    action: 'request' | 'accept' | 'refuse' | 'remove'
  ) => {
    setLoading(true);
    let url = '';
    switch (action) {
      case 'request':
        url = '/api/friends/request.php';
        break;
      case 'accept':
        url = '/api/friends/accept.php';
        break;
      case 'refuse':
        url = '/api/friends/refuse.php';
        break;
      case 'remove':
        url = '/api/friends/remove.php';
        break;
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: userId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onStatusChange(data.friend_status);
      toast.success(data.message || 'Action réussie.');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’action.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'self') return null;
  if (status === 'friends') {
    return (
      <button
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
        disabled={loading}
        onClick={() => handleAction('remove')}
      >
        {loading ? 'Suppression...' : 'Retirer des amis'}
      </button>
    );
  }
  if (status === 'not_friends') {
    return (
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
        disabled={loading}
        onClick={() => handleAction('request')}
      >
        {loading ? 'Envoi...' : 'Ajouter en ami'}
      </button>
    );
  }
  if (status === 'request_sent') {
    return (
      <button
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full cursor-not-allowed"
        disabled
      >
        Demande envoyée
      </button>
    );
  }
  if (status === 'request_received') {
    return (
      <div className="flex space-x-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
          onClick={() => handleAction('accept')}
        >
          {loading ? 'Acceptation...' : 'Accepter'}
        </button>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
          disabled={loading}
          onClick={() => handleAction('refuse')}
        >
          {loading ? 'Refus...' : 'Refuser'}
        </button>
      </div>
    );
  }
  return null;
}
