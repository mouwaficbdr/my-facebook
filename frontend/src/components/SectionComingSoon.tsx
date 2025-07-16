import { Play, Users, BookOpen, Calendar } from 'lucide-react';

const icons = {
  Play,
  Users,
  BookOpen,
  Calendar,
};

interface SectionComingSoonProps {
  label: string;
  color: 'purple' | 'blue' | 'pink' | 'red';
  icon: keyof typeof icons;
}

const colorMap = {
  purple: {
    bg: 'from-purple-400 to-purple-600',
    text: 'text-purple-600',
    halo: 'bg-purple-400/30',
    shadow: 'shadow-purple-200',
  },
  blue: {
    bg: 'from-blue-400 to-blue-600',
    text: 'text-blue-600',
    halo: 'bg-blue-400/30',
    shadow: 'shadow-blue-200',
  },
  pink: {
    bg: 'from-pink-400 to-pink-600',
    text: 'text-pink-600',
    halo: 'bg-pink-400/30',
    shadow: 'shadow-pink-200',
  },
  red: {
    bg: 'from-red-400 to-red-600',
    text: 'text-red-600',
    halo: 'bg-red-400/30',
    shadow: 'shadow-red-200',
  },
};

export default function SectionComingSoon({
  label,
  color,
  icon,
}: SectionComingSoonProps) {
  const Icon = icons[icon];
  const c = colorMap[color];
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] w-full animate-fade-in-up bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Halo animé */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-60 animate-pulse-slow ${c.halo} pointer-events-none z-0`}
      />
      {/* Icône premium avec effet 3D et micro-interaction */}
      <div className={`relative z-10 group transition-transform duration-500`}>
        <div
          className={`w-32 h-32 rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-2xl ${c.shadow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
          style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)' }}
        >
          <Icon
            className={`w-20 h-20 ${c.text} drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`}
          />
        </div>
      </div>
      {/* Message inspirant */}
      <h2
        className="text-4xl md:text-5xl font-extrabold mb-4 mt-10 text-gray-900 tracking-tight animate-fade-in-up"
        style={{ animationDelay: '120ms' }}
      >
        {label} <span className={`${c.text}`}>: bientôt</span>
      </h2>
      <p
        className="text-xl md:text-2xl text-gray-500 mb-8 max-w-2xl text-center animate-fade-in-up"
        style={{ animationDelay: '220ms' }}
      >
        Cette expérience arrive très prochainement.
        <br />
        <span className="font-semibold text-gray-700">
          Préparez-vous à découvrir une nouvelle dimension sociale&nbsp;!
        </span>
      </p>
      {/* Ligne animée */}
      <div className="w-40 h-2 rounded-full bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-pulse mb-2" />
      {/* SVG décoratif premium */}
      <svg
        className="absolute bottom-0 right-0 w-64 h-64 opacity-20 z-0"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="80" fill="url(#paint0_radial)" />
        <defs>
          <radialGradient
            id="paint0_radial"
            cx="0"
            cy="0"
            r="1"
            gradientTransform="translate(100 100) scale(80)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

// Animation utilitaire
// Ajoute dans tailwind.config.js :
//   animation: {
//     'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1) both',
//     'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//   },
//   keyframes: {
//     fadeInUp: {
//       '0%': { opacity: 0, transform: 'translateY(40px) scale(0.98)' },
//       '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
//     },
//   },
