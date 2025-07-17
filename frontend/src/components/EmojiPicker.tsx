import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import ReactDOM from 'react-dom';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({
  onEmojiSelect,
  className = '',
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
      >
        <Smile className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen &&
        typeof window !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            ref={pickerRef}
            className="fixed z-[9999] bottom-20 right-4"
            style={{ zIndex: 9999 }}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              locale="fr"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
