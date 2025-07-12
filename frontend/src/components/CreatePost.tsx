import React, { useState, useRef } from 'react';
import { Image, Smile, MapPin, Calendar, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/posts/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contenu: content,
          type: imageUrl ? 'image' : 'text',
          image_url: imageUrl || null,
          is_public: isPublic,
        }),
      });

      const data = await response.json();

      if (data.success) {
        success('Post créé avec succès !');
        setContent('');
        setImageUrl('');
        setShowImageInput(false);
        onPostCreated(data.data);
      } else {
        throw new Error(data.message || 'Erreur lors de la création du post');
      }
    } catch (err: any) {
      error(err?.message || 'Erreur lors de la création du post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const removeImage = () => {
    setImageUrl('');
    setShowImageInput(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-6 border-0">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
            {user?.prenom?.[0]}
            {user?.nom?.[0]}
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder={`Quoi de neuf, ${user?.prenom} ?`}
              className="border-0 bg-gray-100 resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full px-4 py-2.5 text-lg placeholder:text-gray-500 w-full align-middle"
              rows={1}
              maxLength={5000}
            />
          </div>
        </div>
        {imageUrl && (
          <div className="mb-4 relative mt-4">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                error("Impossible de charger l'image");
              }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-600 flex-1 min-w-[120px] justify-center"
            >
              <Image className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            <button
              type="button"
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-600 flex-1 min-w-[120px] justify-center"
            >
              <Smile className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Humeur</span>
            </button>
            <button
              type="button"
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-600 flex-1 min-w-[120px] justify-center"
            >
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-sm">Lieu</span>
            </button>
            <button
              type="button"
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-600 flex-1 min-w-[120px] justify-center"
            >
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Événement</span>
            </button>
          </div>
        </div>
        {showImageInput && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg mt-2">
            <input
              type="url"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="Collez l'URL de votre image..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Publication...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Publier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
