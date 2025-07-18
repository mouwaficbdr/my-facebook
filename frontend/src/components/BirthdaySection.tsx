import { Gift, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import BirthdayModal from './BirthdayModal';
import { useToast } from '../hooks/useToast';
import LoadingSection from './LoadingSection';
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

export default function BirthdaySection() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/friends/birthdays.php`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.success)
          throw new Error('Erreur lors du chargement des anniversaires');
        setBirthdays(data.birthdays || []);
      })
      .catch((_e) => {
        setError('Impossible de charger les anniversaires.');
        toast.error('Erreur lors du chargement des anniversaires.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="text-sm font-semibold text-gray-700 flex items-center mb-2">
        <Gift className="h-4 w-4 mr-2 text-blue-600" /> Anniversaires
      </div>
      <div className="space-y-3">
        {loading ? (
          <LoadingSection
            message="Chargement des anniversaires..."
            className="py-2"
            spinnerSize="small"
          />
        ) : error ? (
          <div className="text-center text-gray-400 text-sm py-6">{error}</div>
        ) : birthdays.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2">
              <Gift className="h-7 w-7" />
            </div>
            <div className="text-gray-500 text-sm text-center max-w-[180px]">
              Ajoutez des amis et voyez leurs prochains anniversaires ici !
            </div>
          </div>
        ) : (
          <>
            {birthdays.map((b, _i) => (
              <Link
                key={b.id}
                to={`/profile/${b.id}`}
                className="flex items-center space-x-3 group cursor-pointer hover:bg-gray-50 rounded-lg px-1 py-1 transition"
              >
                <Avatar
                  prenom={b.prenom}
                  nom={b.nom}
                  photo={b.photo_profil}
                  size={40}
                  className="h-10 w-10 text-lg group-hover:scale-110 transition-transform duration-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {b.prenom} {b.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.days_left === 0
                      ? "Anniversaire aujourd'hui"
                      : b.days_left === 1
                      ? 'Anniversaire demain'
                      : `Dans ${b.days_left} jours`}
                  </p>
                </div>
              </Link>
            ))}
            <button
              className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center justify-center font-medium cursor-pointer transition"
              onClick={() => setModalOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" /> Voir tous les anniversaires
            </button>
            {modalOpen && (
              <BirthdayModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
