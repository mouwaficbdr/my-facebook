import { useState, useEffect, useRef } from 'react';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ModernToastContainer from '../components/ModernToast';
import type { Toast } from '../components/ModernToast';
import logo from '../assets/facebook-blue-logo-full.png';
import { Link } from 'react-router-dom';

type FormData = {
  email: string;
  password: string;
};

const initialForm: FormData = {
  email: '',
  password: '',
};

export default function Login() {
  const { login: authLogin } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);
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
      case 'email':
        if (!value.trim()) error = "L'adresse e-mail est requise";
        else if (!/^\S+@\S+\.\S+$/.test(value.trim()))
          error = 'Veuillez entrer une adresse e-mail valide';
        break;
      case 'password':
        if (!value.trim()) error = 'Le mot de passe est requis';
        break;
    }
    return error;
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.email.trim()) {
      newErrors.email = "L'adresse e-mail est requise";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      newErrors.email = 'Veuillez entrer une adresse e-mail valide';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
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
      const res = await login(form.email, form.password);
      notify('Connexion réussie !', 'success');

      // Utiliser le contexte d'authentification pour connecter l'utilisateur
      authLogin(res.user);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        setErrors((err as { errors: Record<string, string> }).errors);
        notify(
          Object.values(
            (err as { errors: Record<string, string> }).errors
          ).join(' | '),
          'error'
        );
      } else {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la connexion';
        notify(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

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
              Connexion
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Accédez à votre compte.
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
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
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top duration-300">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  Mot de passe
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
                    autoComplete="current-password"
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
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  Mot de passe oublié ?
                </Link>
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
                    Connexion en cours...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    Se connecter
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
                    Entrez vos identifiants pour accéder à votre compte. Vos
                    données sont sécurisées.
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Register Link */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Vous n'avez pas de compte ?{' '}
              <Link
                to="/register"
                className="text-transparent bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 cursor-pointer"
              >
                Créer un compte
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
