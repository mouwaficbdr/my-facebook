import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ModernToast from '../components/ModernToast';
import type { Toast } from '../components/ModernToast';
import Loading from '../components/Loading';
import logo from '../assets/facebook-blue-logo-full.png';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setSuccess(false);
      setMessage('Lien de confirmation invalide ou manquant.');
      setLoading(false);
      return;
    }
    // Appel API backend
    fetch(`/api/confirm_email.php?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccess(true);
          setMessage(data.message || 'Email confirmé avec succès.');
        } else {
          setSuccess(false);
          setMessage(data.message || 'Lien invalide ou déjà utilisé.');
        }
      })
      .catch(() => {
        setSuccess(false);
        setMessage('Erreur lors de la confirmation.');
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) return <Loading delay={300} />;

  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center p-4">
      <ModernToast
        toasts={toasts}
        onRemove={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))}
      />
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Logo"
            className="mb-4 w-44 drop-shadow-xl z-10 mx-auto"
            style={{ filter: 'drop-shadow(0 0 32px #3b82f6aa)' }}
          />
        </div>
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
          {success === true ? (
            <>
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse shadow-2xl mb-8">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Email confirmé ! ✅</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <Link
                to="/login"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Se connecter
              </Link>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-2xl mb-8">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Erreur</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 