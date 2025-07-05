import { useState } from 'react';
import { signup } from '../api/auth';
import Loading from '../components/Loading';
import ToastContainer from '../components/Toast';
import type { Toast } from '../components/Toast';
import logo from '../assets/facebook-blue-logo-full.png';
import { Link } from 'react-router-dom';

const GENRES = [
  { value: 'Femme', label: 'Femme' },
  { value: 'Homme', label: 'Homme' },
  { value: 'Autre', label: 'Personnalisé' },
] as const;

type FormData = {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  genre: 'Homme' | 'Femme' | 'Autre';
  date_naissance: string;
};

const initialForm: FormData = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  genre: 'Homme',
  date_naissance: '',
};

export default function Register() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (msg: string, type: Toast['type'] = 'info') => {
    setToasts((ts) => [
      ...ts,
      { id: Date.now() + Math.random() + '', message: msg, type },
    ]);
  };

  const validateField = (name: keyof FormData, value: string) => {
    let error = '';
    switch (name) {
      case 'prenom':
      case 'nom':
        if (!value.trim()) error = 'Ce champ est requis';
        else if (/\d/.test(value))
          error = 'Ce champ ne doit pas contenir de chiffres';
        break;
      case 'email':
        if (!value.trim()) error = "L'adresse e-mail est requise";
        else if (!/^\S+@\S+\.\S+$/.test(value))
          error = 'Veuillez entrer une adresse e-mail valide';
        break;
      case 'password':
        if (!value.trim()) error = 'Le mot de passe est requis';
        else if (value.length < 8)
          error = 'Le mot de passe doit contenir au moins 8 caractères';
        break;
      case 'date_naissance':
        if (!value) error = 'La date de naissance est requise';
        break;
      case 'genre':
        if (!value) error = 'Le genre est requis';
        break;
    }
    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (touched[name as keyof FormData]) {
      setErrors({
        ...errors,
        [name]: validateField(name as keyof FormData, value),
      });
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, form[name]) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Marquer tous les champs comme touchés
    const allTouched: Partial<Record<keyof FormData, boolean>> = {};
    (Object.keys(form) as (keyof FormData)[]).forEach(
      (k) => (allTouched[k] = true)
    );
    setTouched(allTouched);
    // Valider tous les champs
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    (Object.keys(form) as (keyof FormData)[]).forEach((k) => {
      newErrors[k] = validateField(k, form[k]);
    });
    setErrors(newErrors);
    // Vérifier s'il y a des erreurs
    if (Object.values(newErrors).some((e) => e)) return;
    setLoading(true);
    try {
      const res = await signup({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        password: form.password,
        genre: form.genre,
        date_naissance: form.date_naissance,
      });
      notify(res.message || 'Inscription réussie.', 'success');
      setForm(initialForm);
      setTouched({});
      setErrors({});
    } catch (err: any) {
      if (err?.errors) {
        // Afficher toutes les erreurs backend sous les champs concernés
        setErrors(err.errors);
        notify(Object.values(err.errors).join(' | '), 'error');
      } else {
        notify(err?.message || 'Erreur inconnue', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-green-100 relative overflow-hidden">
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))}
      />
      <img
        src={logo}
        alt="Logo"
        className="mb-4 w-44 drop-shadow-xl z-10"
        style={{ filter: 'drop-shadow(0 0 32px #3b82f6aa)' }}
      />
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 w-full max-w-md animate-fade-in z-10">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 text-center">
            Créer un compte
          </h2>
          <p className="text-sm text-gray-600 text-center">
            C'est rapide et facile.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom de famille
              </label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                onBlur={() => handleBlur('nom')}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                  touched.nom && errors.nom
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              {touched.nom && errors.nom && (
                <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor="prenom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prénom
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                onBlur={() => handleBlur('prenom')}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                  touched.prenom && errors.prenom
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              {touched.prenom && errors.prenom && (
                <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Adresse e-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                touched.email && errors.email
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              required
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                touched.password && errors.password
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              required
            />
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="date_naissance"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date de naissance
            </label>
            <input
              type="date"
              id="date_naissance"
              name="date_naissance"
              value={form.date_naissance}
              onChange={handleChange}
              onBlur={() => handleBlur('date_naissance')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base ${
                touched.date_naissance && errors.date_naissance
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              required
              max={new Date().toISOString().split('T')[0]}
            />
            {touched.date_naissance && errors.date_naissance && (
              <p className="text-red-500 text-xs mt-1">
                {errors.date_naissance}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sexe
            </label>
            <div className="flex gap-3">
              {GENRES.map((g) => (
                <label
                  key={g.value}
                  className="flex items-center flex-1 border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="genre"
                    value={g.value}
                    checked={form.genre === g.value}
                    onChange={handleChange}
                    onBlur={() => handleBlur('genre')}
                    className="mr-2 accent-blue-600"
                    required
                  />
                  <span className="text-sm">{g.label}</span>
                </label>
              ))}
            </div>
            {touched.genre && errors.genre && (
              <p className="text-red-500 text-xs mt-1">{errors.genre}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md text-lg mt-2 shadow-sm transition-colors duration-150 cursor-pointer"
            disabled={loading}
          >
            S'inscrire
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-4">
          En cliquant sur S'inscrire, vous acceptez nos{' '}
          <a href="#" className="text-blue-600 hover:underline cursor-pointer">
            Conditions
          </a>
          , notre{' '}
          <a href="#" className="text-blue-600 hover:underline cursor-pointer">
            Politique de confidentialité
          </a>{' '}
          et notre{' '}
          <a href="#" className="text-blue-600 hover:underline cursor-pointer">
            Politique d'utilisation des cookies
          </a>
          .
        </p>
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
      <footer className="mt-8 text-xs text-blue-400/80 z-10">
        © {new Date().getFullYear()} MyFacebook. Un projet inspiré, pas affilié
        à Meta.
      </footer>
    </div>
  );
}

// Ajoute dans index.css :
// .btn-green { @apply bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition; }
// .input { @apply border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full; }
// .animate-fade-in-down { animation: fadeInDown 0.4s; }
// @keyframes fadeInDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
