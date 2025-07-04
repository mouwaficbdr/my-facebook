import logo from '@/assets/facebook-blue-logo-full.png';

/**
 * Composant Loading : loader moderne façon Facebook, bulle animée + shimmer
 * - Full Tailwind, responsive, accessible
 * - Peut être utilisé partout (page, bouton, section...)
 */
const Loading = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-50 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center relative">
        {/* Logo agrandi, sans halo */}
        <img
          src={logo}
          alt="Facebook"
          className="w-32 md:w-44 mb-4 animate-pulse"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.15))' }}
        />
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: '0s' }}
          ></span>
          <span
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.15s' }}
          ></span>
          <span
            className="w-3 h-3 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: '0.3s' }}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
