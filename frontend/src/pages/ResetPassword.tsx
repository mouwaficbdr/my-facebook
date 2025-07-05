// TODO: Page de réinitialisation du mot de passe
// - Formulaire pour saisir le nouveau mot de passe (et confirmation)
// - Validation du token (récupéré dans l'URL)
// - Appel API backend pour valider le token et enregistrer le nouveau mot de passe
// - Affichage des messages d'erreur/succès
// - UX/Design Tailwind, responsive, sécurisé

import { useState, useEffect, useRef } from 'react';
import { resetPassword } from '../api/auth';
import Loading from '../components/Loading';
import ModernToastContainer from '../components/ModernToast';
import type { Toast } from '../components/ModernToast';
import logo from '../assets/facebook-blue-logo-full.png';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

type FormData = {
  password: string;
  confirmPassword: string;
};

const initialForm: FormData = {
  password: '',
  confirmPassword: '',
};

export default function ResetPassword() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [focusedField, setFocusedField] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string>('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get token from URL params
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setTokenValid(true); // Assume valid for now, will be validated on submit
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

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
    }
    return error;
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (form.password.length < 8) {
      newErrors.password =
        'Le mot de passe doit contenir au moins 8 caractères';
    } else if (form.password.length > 64) {
      newErrors.password = 'Le mot de passe ne doit pas dépasser 64 caractères';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      newErrors.password =
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await resetPassword(token, form.password);
      notify(res.message || 'Mot de passe mis à jour avec succès.', 'success');
      setSuccess(true);
      setForm(initialForm);
      setTouched({});
      setErrors({});

      // Redirection vers la page de login après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      if (err?.errors) {
        setErrors(err.errors);
        notify(Object.values(err.errors).join(' | '), 'error');
      } else {
        notify(err?.message || 'Erreur lors de la réinitialisation', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  // Token invalid or missing
  if (tokenValid === false) {
    return (
      <div className="min-h-screen overflow-hidden relative">
        <ModernToastContainer
          toasts={toasts}
          onRemove={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))}
        />

        {/* Animated Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute w-96 h-96 bg-gradient-to-r from-red-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute w-96 h-96 bg-gradient-to-r from-red-300 to-red-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <img
                src={logo}
                alt="Logo"
                className="mb-4 w-44 drop-shadow-xl z-10 mx-auto"
                style={{ filter: 'drop-shadow(0 0 32px #3b82f6aa)' }}
              />
            </div>

            <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="text-center py-12">
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-2xl">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Lien invalide
                </h2>
                <p className="text-gray-600 mb-8">
                  Le lien de réinitialisation est invalide ou a expiré. Veuillez
                  demander un nouveau lien.
                </p>
                <Link
                  to="/forgot-password"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      <ModernToastContainer
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
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Choisissez un nouveau mot de passe sécurisé.
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
            {success ? (
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
                  Mot de passe mis à jour ! ✅
                </h2>
                <p className="text-gray-600 mb-8">
                  Votre mot de passe a été mis à jour avec succès. Vous allez
                  être redirigé vers la page de connexion.
                </p>
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  Se connecter maintenant
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => {
                        setFocusedField('');
                        handleBlur('password');
                      }}
                      className={`w-full px-4 py-4 pr-12 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                        errors.password
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      } ${
                        focusedField === 'password'
                          ? 'shadow-2xl bg-white/60'
                          : ''
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                      {errors.password}
                    </p>
                  )}

                  {/* Password Strength Indicator */}
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

                {/* Confirm Password Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => {
                        setFocusedField('');
                        handleBlur('confirmPassword');
                      }}
                      className={`w-full px-4 py-4 pr-12 bg-white/40 backdrop-blur-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:scale-105 focus:shadow-xl ${
                        errors.confirmPassword
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      } ${
                        focusedField === 'confirmPassword'
                          ? 'shadow-2xl bg-white/60'
                          : ''
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-size-200 hover:bg-pos-100 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed group w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
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
                      Mise à jour en cours...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      Mettre à jour le mot de passe
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

                {/* Info Box */}
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
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700">
                      Choisissez un mot de passe sécurisé avec au moins 8
                      caractères, incluant une majuscule, une minuscule et un
                      chiffre.
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Vous vous souvenez de votre mot de passe ?{' '}
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
