import React, { useRef, useState } from 'react';
import { X, Image, Smile, Send } from 'lucide-react';
import Avatar from './Avatar';
// import EmojiPicker from './EmojiPicker'; // à créer/installer
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { uploadPostImage, createPost } from '../api/feed';
import ReactDOM from 'react-dom';
import type { Post } from '../api/feed';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

export default function PostModal({
  isOpen,
  onClose,
  onPostCreated,
}: PostModalProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fermer avec ESC ou clic overlay
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Gestion image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Insertion emoji à la position du curseur
  const insertEmoji = (emoji: any) => {
    if (!textareaRef.current) return;
    const ref = textareaRef.current;
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const emojiChar = emoji.native;
    setContent(before + emojiChar + after);
    setTimeout(() => {
      ref.focus();
      ref.selectionStart = ref.selectionEnd = start + emojiChar.length;
    }, 0);
    setShowEmojiPicker(false);
  };

  // Gestion fermeture picker au clic en dehors
  React.useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);

  if (!isOpen) return null;

  // TODO: handleSubmit (API call)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        // Upload image
        imageUrl = await uploadPostImage(imageFile);
      }
      // Créer le post
      const post = await createPost({
        contenu: content,
        type: imageUrl ? 'image' : 'text',
        image_url: imageUrl || undefined,
        is_public: true,
      });
      success('Post créé avec succès !');
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      onPostCreated(post);
      onClose();
    } catch (err: unknown) {
      // Remplacement de 'any' par 'unknown' pour plus de sûreté
      error((err as any)?.message || 'Erreur lors de la création du post'); // TODO: typer précisément l'erreur
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              userId={user?.id}
              prenom={user?.prenom || ''}
              nom={user?.nom || ''}
              photo={user?.photo_profil}
              size={40}
              className="h-10 w-10"
            />
            <span className="font-semibold text-gray-900 text-lg">
              Créer une publication
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {/* Body */}
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Quoi de neuf, ${user?.prenom} ?`}
            className="w-full border-0 bg-gray-100 resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 text-lg placeholder:text-gray-500 min-h-[80px] max-h-60 mb-3"
            rows={3}
            maxLength={5000}
            autoFocus
          />
          {imagePreview && (
            <div className="mb-4 relative mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl"
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
          <div className="flex items-center gap-2 mt-2 relative">
            <label className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Image className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-yellow-500 transition-colors relative"
              onClick={() => setShowEmojiPicker((v) => !v)}
            >
              <Smile className="h-5 w-5" />
              <span className="text-sm font-medium">Emoji</span>
            </button>
            {showEmojiPicker &&
              typeof window !== 'undefined' &&
              ReactDOM.createPortal(
                <div
                  ref={pickerRef}
                  className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <Picker
                    data={data}
                    onEmojiSelect={insertEmoji}
                    theme="light"
                    locale="fr"
                    previewPosition="none"
                    searchPosition="none"
                  />
                </div>,
                document.body
              )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-semibold shadow-lg"
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
    </div>
  );
}
