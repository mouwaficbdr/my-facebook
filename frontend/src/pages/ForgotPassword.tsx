import { useState, useEffect, useRef } from 'react';
import { forgotPassword } from '../api/auth';
import Loading from '../components/Loading';
import ModernToastContainer from '../components/ModernToast';
import type { Toast } from '../components/ModernToast';
import logo from '../assets/facebook-blue-logo-full.png';
import { Link } from 'react-router-dom';

type FormData = {
  email: string;
};

const initialForm: FormData = {
  email: '',
};

export default function ForgotPassword() {
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
  const [success, setSuccess] = useState(false);
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
      const res = await forgotPassword(form.email);
      notify(res.message || 'Email de réinitialisation envoyé.', 'success');
      setSuccess(true);
      setForm(initialForm);
      setTouched({});
      setErrors({});
    } catch (err: any) {
      if (err?.errors) {
        setErrors(err.errors);
        notify(Object.values(err.errors).join(' | '), 'error');
      } else {
        notify(err?.message || "Erreur lors de l'envoi", 'error');
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
              Mot de passe oublié
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Nous vous aiderons à récupérer votre compte.
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
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-ping opacity-20"></div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Email envoyé ! 📧
                </h2>
                <p className="text-gray-600 mb-8">
                  Nous avons envoyé un lien de réinitialisation à votre adresse
                  email. Vérifiez votre boîte de réception et suivez les
                  instructions.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    Envoyer un autre email
                  </button>
                  <div>
                    <Link
                      to="/login"
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                    >
                      Retour à la connexion
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
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
                      Envoi en cours...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      Envoyer le lien de réinitialisation
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
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-700">
                      Entrez l'adresse email associée à votre compte. Nous vous
                      enverrons un lien sécurisé pour réinitialiser votre mot de
                      passe.
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
