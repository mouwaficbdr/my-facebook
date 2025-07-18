import { useState } from 'react';
import PostModal from './PostModal';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm mb-6 border-0">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            {user && (
              <Avatar
                userId={user.id}
                prenom={user.prenom}
                nom={user.nom}
                photo={user.photo_profil}
                size={44}
                className="flex-shrink-0"
              />
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full text-left border-0 bg-gray-100 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full px-4 py-2.5 text-lg placeholder:text-gray-500 align-middle text-gray-700 transition-colors cursor-pointer"
            >
              Quoi de neuf ?
            </button>
          </div>
        </div>
      </div>
      <PostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPostCreated={onPostCreated}
      />
    </>
  );
}
