import { Gift, UserPlus, TrendingUp, Calendar } from 'lucide-react';

export default function RightSidebar() {
  return (
    <div className="hidden xl:block w-80 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="p-4 space-y-4">
        {/* Birthdays */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-sm font-semibold text-gray-700 flex items-center mb-2">
            <Gift className="h-4 w-4 mr-2 text-blue-600" /> Anniversaires
          </div>
          <div className="space-y-3">
            {[
              { name: 'Marie Dupont', date: "aujourd'hui" },
              { name: 'Thomas Martin', date: 'demain' },
            ].map((birthday, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {birthday.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {birthday.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {birthday.date === "aujourd'hui"
                      ? "Anniversaire aujourd'hui"
                      : `Anniversaire ${birthday.date}`}
                  </p>
                </div>
              </div>
            ))}
            <button className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center justify-center font-medium">
              <Calendar className="h-4 w-4 mr-2" /> Voir tous les anniversaires
            </button>
          </div>
        </div>
        {/* Friend Suggestions */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-sm font-semibold text-gray-700 flex items-center mb-2">
            <UserPlus className="h-4 w-4 mr-2 text-blue-600" /> Suggestions
            d'amis
          </div>
          <div className="space-y-4">
            {[
              { name: 'Emma Moreau', mutual: 2 },
              { name: 'Lucas Petit', mutual: 1 },
            ].map((s, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {s.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.mutual} ami{s.mutual > 1 ? 's' : ''} en commun
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
                      Ajouter
                    </button>
                    <button className="flex-1 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium">
                      Ignorer
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
              Voir plus de suggestions
            </button>
          </div>
        </div>
        {/* Trending Topics */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          {/* TODO: Connecter les tendances à l'API ou à des données dynamiques */}
          <div className="text-sm font-semibold text-gray-700 flex items-center mb-2">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" /> Tendances
          </div>
          <div className="space-y-2">
            {/* TODO: Boucle sur des tendances statiques, à remplacer par des données dynamiques */}
            {[
              { topic: '#TechParis2024', posts: '15.2k publications' },
              { topic: '#CuisinePartage', posts: '8.7k publications' },
              { topic: '#VoyageEurope', posts: '12.1k publications' },
            ].map((trend, i) => (
              <div
                key={i}
                className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">
                  {trend.topic}
                </p>
                <p className="text-xs text-gray-500">{trend.posts}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="text-xs text-gray-500 px-4 space-y-1">
          <div className="flex flex-wrap gap-2">
            <span>Confidentialité</span>
            <span>·</span>
            <span>Conditions</span>
            <span>·</span>
            <span>Publicité</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span>Choix publicitaires</span>
            <span>·</span>
            <span>Cookies</span>
          </div>
          <div className="mt-2">
            <span>MyFacebook © 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}
