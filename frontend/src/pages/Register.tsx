import { useState, useEffect, useRef } from 'react';
import { signup } from '../api/auth';
import Loading from '../components/Loading';
import ModernToast from '../components/ModernToast';
import type { Toast } from '../components/ModernToast';
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
  confirmPassword: string;
  genre: 'Homme' | 'Femme' | 'Autre';
  date_naissance: string;
};

const initialForm: FormData = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  confirmPassword: '',
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
  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const formRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (formRef.current) {
        const rect = formRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
        else if (value.trim().length < 2) error = 'Minimum 2 caractères';
        else if (value.trim().length > 50) error = 'Maximum 50 caractères';
        else if (!/^[a-zA-ZÀ-ÿ\s\-]+$/u.test(value.trim()))
          error = 'Lettres et espaces uniquement';
        break;
      case 'email':
        if (!value.trim()) error = "L'adresse e-mail est requise";
        else if (value.trim().length > 255)
          error = 'Email trop long (max 255 caractères)';
        else if (!/^\S+@\S+\.\S+$/.test(value.trim()))
          error = 'Veuillez entrer une adresse e-mail valide';
        break;
      case 'password':
        if (!value.trim()) error = 'Le mot de passe est requis';
        else if (value.length < 8)
          error = 'Le mot de passe doit contenir au moins 8 caractères';
        else if (value.length > 64)
          error = 'Le mot de passe ne doit pas dépasser 64 caractères';
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value))
          error =
            'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
        break;
      case 'confirmPassword':
        if (!value.trim())
          error = 'La confirmation du mot de passe est requise';
        else if (value !== form.password)
          error = 'Les mots de passe ne correspondent pas';
        break;
      case 'date_naissance':
        if (!value) error = 'La date de naissance est requise';
        else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            // L'anniversaire n'est pas encore passé cette année
            if (age - 1 < 13) {
              error = 'Vous devez avoir au moins 13 ans pour vous inscrire';
            }
          } else {
            if (age < 13) {
              error = 'Vous devez avoir au moins 13 ans pour vous inscrire';
            }
          }

          // Vérifier que la date n'est pas dans le futur
          if (birthDate > today) {
            error = 'La date de naissance ne peut pas être dans le futur';
          }
        }
        break;
      case 'genre':
        if (!value) error = 'Le genre est requis';
        else if (!['Homme', 'Femme', 'Autre'].includes(value))
          error = 'Valeur non autorisée';
        break;
    }
    return error;
  };

  const validateStep = (step: number) => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
      else if (form.prenom.trim().length < 2)
        newErrors.prenom = 'Minimum 2 caractères';
      else if (form.prenom.trim().length > 50)
        newErrors.prenom = 'Maximum 50 caractères';
      else if (!/^[a-zA-ZÀ-ÿ\s\-]+$/u.test(form.prenom.trim()))
        newErrors.prenom = 'Lettres et espaces uniquement';

      if (!form.nom.trim()) newErrors.nom = 'Le nom est requis';
      else if (form.nom.trim().length < 2)
        newErrors.nom = 'Minimum 2 caractères';
      else if (form.nom.trim().length > 50)
        newErrors.nom = 'Maximum 50 caractères';
      else if (!/^[a-zA-ZÀ-ÿ\s\-]+$/u.test(form.nom.trim()))
        newErrors.nom = 'Lettres et espaces uniquement';

      if (!form.email.trim()) {
        newErrors.email = "L'adresse e-mail est requise";
      } else if (form.email.trim().length > 255) {
        newErrors.email = 'Email trop long (max 255 caractères)';
      } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        newErrors.email = 'Veuillez entrer une adresse e-mail valide';
      }
    }

    if (step === 2) {
      if (!form.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (form.password.length < 8) {
        newErrors.password =
          'Le mot de passe doit contenir au moins 8 caractères';
      } else if (form.password.length > 64) {
        newErrors.password =
          'Le mot de passe ne doit pas dépasser 64 caractères';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
        newErrors.password =
          'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword =
          'La confirmation du mot de passe est requise';
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    if (step === 3) {
      if (!form.date_naissance) {
        newErrors.date_naissance = 'La date de naissance est requise';
      } else {
        const birthDate = new Date(form.date_naissance);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          // L'anniversaire n'est pas encore passé cette année
          if (age - 1 < 13) {
            newErrors.date_naissance =
              'Vous devez avoir au moins 13 ans pour vous inscrire';
          }
        } else {
          if (age < 13) {
            newErrors.date_naissance =
              'Vous devez avoir au moins 13 ans pour vous inscrire';
          }
        }

        // Vérifier que la date n'est pas dans le futur
        if (birthDate > today) {
          newErrors.date_naissance =
            'La date de naissance ne peut pas être dans le futur';
        }
      }

      if (!form.genre) {
        newErrors.genre = 'Le genre est requis';
      } else if (!['Homme', 'Femme', 'Autre'].includes(form.genre)) {
        newErrors.genre = 'Valeur non autorisée';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, form[name]) });
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

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
      setCurrentStep(4); // Success step
    } catch (err: any) {
      if (err?.errors) {
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

  const renderStep = () => {
    if (currentStep === 4) {
      return (
        <div className="text-center py-12">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-pulse shadow-2xl">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bienvenue sur MyFacebook ! 🎉
          </h2>
          <p className="text-gray-600 mb-8">
            Votre compte a été créé avec succès. Vous pouvez maintenant vous
            connecter et commencer à partager.
          </p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            Se connecter
          </Link>
        </div>
      );
    }

    return (
      <>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Étape {currentStep} sur 3
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <form
          onSubmit={
            currentStep === 3
              ? handleSubmit
              : (e) => {
                  e.preventDefault();
                  nextStep();
                }
          }
        >
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Vos informations personnelles
                </h2>
                <p className="text-gray-600">
                  Commençons par apprendre à vous connaître
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Prénom
                  </label>
                  <input
                    name="prenom"
                    type="text"
                    value={form.prenom}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('prenom')}
                    onBlur={() => {
                      setFocusedField('');
                      handleBlur('prenom');
                    }}
                    className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                      errors.prenom
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    } ${
                      focusedField === 'prenom' ? 'shadow-2xl bg-white/60' : ''
                    }`}
                    placeholder="Votre prénom"
                  />
                  {errors.prenom && (
                    <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                      {errors.prenom}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Nom
                  </label>
                  <input
                    name="nom"
                    type="text"
                    value={form.nom}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('nom')}
                    onBlur={() => {
                      setFocusedField('');
                      handleBlur('nom');
                    }}
                    className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                      errors.nom
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    } ${
                      focusedField === 'nom' ? 'shadow-2xl bg-white/60' : ''
                    }`}
                    placeholder="Votre nom"
                  />
                  {errors.nom && (
                    <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                      {errors.nom}
                    </p>
                  )}
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  Adresse email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => {
                    setFocusedField('');
                    handleBlur('email');
                  }}
                  className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                    errors.email
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } ${
                    focusedField === 'email' ? 'shadow-2xl bg-white/60' : ''
                  }`}
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Security */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sécurité de votre compte
                </h2>
                <p className="text-gray-600">
                  Choisissez un mot de passe robuste pour protéger votre compte
                </p>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  Mot de passe
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => {
                    setFocusedField('');
                    handleBlur('password');
                  }}
                  className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } ${
                    focusedField === 'password' ? 'shadow-2xl bg-white/60' : ''
                  }`}
                  placeholder="••••••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                    {errors.password}
                  </p>
                )}
                <div className="mt-2 flex space-x-1">
                  {(() => {
                    const conditions = [
                      form.password.length >= 8,
                      /[a-z]/.test(form.password),
                      /[A-Z]/.test(form.password),
                      /\d/.test(form.password),
                    ];

                    const strength = conditions.filter(Boolean).length;

                    return [1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength
                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                            : 'bg-gray-200'
                        }`}
                        title={(() => {
                          const labels = [
                            '8+ caractères',
                            'Minuscule',
                            'Majuscule',
                            'Chiffre',
                          ];
                          return labels[i - 1];
                        })()}
                      ></div>
                    ));
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Force du mot de passe
                </p>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  Confirmer le mot de passe
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => {
                    setFocusedField('');
                    handleBlur('confirmPassword');
                  }}
                  className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } ${
                    focusedField === 'confirmPassword'
                      ? 'shadow-2xl bg-white/60'
                      : ''
                  }`}
                  placeholder="••••••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                    {errors.confirmPassword}
                  </p>
                )}
                {form.confirmPassword &&
                  form.password === form.confirmPassword && (
                    <div className="mt-2 flex items-center text-green-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm">
                        Les mots de passe correspondent
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Step 3: Final Details */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Derniers détails
                </h2>
                <p className="text-gray-600">
                  Encore quelques informations et c'est terminé !
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Date de naissance
                  </label>
                  <input
                    name="date_naissance"
                    type="date"
                    value={form.date_naissance}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('date_naissance')}
                    onBlur={() => {
                      setFocusedField('');
                      handleBlur('date_naissance');
                    }}
                    className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                      errors.date_naissance
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    } ${
                      focusedField === 'date_naissance'
                        ? 'shadow-2xl bg-white/60'
                        : ''
                    }`}
                    max={(() => {
                      const today = new Date();
                      const minAge = new Date();
                      minAge.setFullYear(today.getFullYear() - 13);
                      return minAge.toISOString().split('T')[0];
                    })()}
                  />
                  {errors.date_naissance && (
                    <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                      {errors.date_naissance}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Genre
                  </label>
                  <select
                    name="genre"
                    value={form.genre}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('genre')}
                    onBlur={() => {
                      setFocusedField('');
                      handleBlur('genre');
                    }}
                    className={`w-full px-4 py-4 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                      errors.genre
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    } ${
                      focusedField === 'genre' ? 'shadow-2xl bg-white/60' : ''
                    }`}
                  >
                    {GENRES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {errors.genre && (
                    <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                      {errors.genre}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-700">
                    En créant votre compte, vous acceptez nos{' '}
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                    >
                      Conditions
                    </a>
                    , notre{' '}
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                    >
                      Politique de confidentialité
                    </a>{' '}
                    et notre{' '}
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                    >
                      Politique d'utilisation des cookies
                    </a>
                    .
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors group"
              >
                <svg
                  className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Retour
              </button>
            )}

            <div className="flex-1"></div>

            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-size-200 hover:bg-pos-100 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Création en cours...
                </div>
              ) : (
                <span className="flex items-center">
                  {currentStep === 3 ? 'Créer mon compte' : 'Continuer'}
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <ModernToast
        toasts={toasts}
        onRemove={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))}
      />

      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"
            style={{
              left: `${20 + mousePosition.x * 10}%`,
              top: `${10 + mousePosition.y * 10}%`,
            }}
          ></div>
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-300 to-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"
            style={{
              right: `${20 + mousePosition.x * 5}%`,
              bottom: `${10 + mousePosition.y * 5}%`,
            }}
          ></div>
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"
            style={{
              left: `${60 + mousePosition.x * 8}%`,
              bottom: `${30 + mousePosition.y * 8}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="Logo"
              className="mb-4 w-44 drop-shadow-xl z-10 mx-auto"
              style={{ filter: 'drop-shadow(0 0 32px #3b82f6aa)' }}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 text-center">
              Créer un compte
            </h1>
            <p className="text-sm text-gray-600 text-center">
              C'est rapide et facile.
            </p>
          </div>

          {/* Form Container */}
          <div
            ref={formRef}
            className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)`,
              transform: `perspective(1000px) rotateY(${
                mousePosition.x * 5
              }deg) rotateX(${mousePosition.y * 5}deg)`,
            }}
          >
            {renderStep()}
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link
                to="/login"
                className="text-transparent bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 cursor-pointer"
              >
                Se connecter
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200/30">
            <p className="text-xs text-blue-400/80">
              © {new Date().getFullYear()} MyFacebook. Un projet inspiré, pas
              affilié à Meta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ajoute dans index.css :
// .btn-green { @apply bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition; }
// .input { @apply border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full; }
// .animate-fade-in-down { animation: fadeInDown 0.4s; }
// @keyframes fadeInDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
