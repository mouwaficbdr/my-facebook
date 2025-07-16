import { X, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';
import Loading from './Loading';
import Avatar from './Avatar';
import { Link } from 'react-router-dom';

interface Birthday {
  id: number;
  nom: string;
  prenom: string;
  photo_profil: string | null;
  next_birthday: string;
  days_left: number;
}

interface BirthdayModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BirthdayModal({ open, onClose }: BirthdayModalProps) {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${API_BASE}/api/friends/birthdays.php?limit=10`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success)
          throw new Error('Erreur lors du chargement des anniversaires');
        setBirthdays(data.birthdays || []);
      })
      .catch(() => {
        setError('Impossible de charger les anniversaires.');
      })
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative animate-modal-pop">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center mb-4">
          <Gift className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">
            Prochains anniversaires
          </h2>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loading />
            </div>
          ) : error ? (
            <div className="text-center text-gray-400 text-sm py-10">
              {error}
            </div>
          ) : birthdays.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2">
                <Gift className="h-7 w-7" />
              </div>
              <div className="text-gray-500 text-sm text-center max-w-[200px]">
                Ajoutez des amis pour voir leurs anniversaires ici !
              </div>
            </div>
          ) : (
            birthdays.map((b) => (
              <Link
                key={b.id}
                to={`/profile/${b.id}`}
                className="flex items-center space-x-3 group cursor-pointer hover:bg-gray-50 rounded-lg px-1 py-1 transition"
              >
                <Avatar
                  prenom={b.prenom}
                  nom={b.nom}
                  photo={b.photo_profil}
                  size={44}
                  className="h-11 w-11 text-lg group-hover:scale-110 transition-transform duration-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {b.prenom} {b.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.days_left === 0
                      ? "Anniversaire aujourd'hui"
                      : b.days_left === 1
                      ? 'Anniversaire demain'
                      : `Dans ${b.days_left} jours`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(b.next_birthday).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                    })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
