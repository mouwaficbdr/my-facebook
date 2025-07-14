import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface ImageUploadButtonProps {
  endpoint: string;
  currentImage?: string;
  onSuccess: (url: string) => void;
  icon: React.ReactNode;
  size?: number;
  label?: string;
  className?: string;
  onPreview?: (url: string | null) => void;
  shape?: 'circle' | 'square';
}

export default function ImageUploadButton({
  endpoint,
  currentImage,
  onSuccess,
  icon,
  size = 96,
  label,
  className = '',
  onPreview,
  shape = 'square',
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();

  const borderRadius = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // Après la sélection d'un fichier, appeler handleUpload lors de la validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      handleUpload(file); // Appel direct pour corriger l'erreur
    }
  };

  const handleDelete = async () => {
    if (!endpoint) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.info('Cliquez à nouveau pour confirmer la suppression');
      setTimeout(() => setConfirmDelete(false), 2000);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Photo supprimée');
      setPreview(null);
      if (onPreview) onPreview(null);
      // onDelete is not passed as a prop, so this callback is not called here.
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPreview(null);
      if (onPreview) onPreview(null);
      onSuccess(data.url); // Appel de la prop onSuccess après upload réussi
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’upload');
      setPreview(null);
      if (onPreview) onPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        `${className} relative group flex items-center justify-center overflow-hidden ` +
        borderRadius
      }
      style={{ width: size, height: size }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />
      {/* Image preview ou image courante */}
      {(preview || currentImage) && (
        <img
          src={preview || currentImage}
          alt="preview"
          className={
            `object-cover w-full h-full ${borderRadius} border-2 border-white shadow` +
            (loading ? ' opacity-60' : '')
          }
          style={{ width: '100%', height: '100%' }}
          draggable={false}
        />
      )}
      {/* Overlay caméra (upload) - toujours visible, hover accentué */}
      {!preview && !loading && (
        <button
          type="button"
          className={`absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 ${borderRadius} transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-400`}
          style={{ width: '100%', height: '100%' }}
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          title={label}
          tabIndex={0}
        >
          {icon || <Camera className="w-7 h-7 text-white drop-shadow" />}
        </button>
      )}
      {/* Bouton supprimer (corbeille) - visible si image présente, pas de preview, pas loading, endpoint fourni */}
      {currentImage && !preview && !loading && endpoint && (
        <button
          type="button"
          className={`absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-red-600 p-1 ${borderRadius} shadow z-20 focus:outline-none focus:ring-2 focus:ring-red-400 transition`}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleDelete}
          title={confirmDelete ? 'Cliquez pour confirmer' : 'Retirer la photo'}
          tabIndex={0}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
      {loading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-white/60 ${borderRadius} z-20`}
        >
          <span className="text-blue-600 font-bold animate-pulse">...</span>
        </div>
      )}
    </div>
  );
}
