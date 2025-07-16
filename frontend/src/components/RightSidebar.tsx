import { TrendingUp } from 'lucide-react';
import BirthdaySection from './BirthdaySection';
import FriendSuggestionsSection from './FriendSuggestionsSection';

export default function RightSidebar() {
  return (
    <div className="hidden xl:block w-80 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="p-4 space-y-4">
        {/* Birthdays */}
        <BirthdaySection />
        {/* Friend Suggestions */}
        <FriendSuggestionsSection />
        {/* Trending Topics */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="text-sm font-semibold text-gray-700 flex items-center mb-2">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" /> Tendances
          </div>
          <div className="text-gray-400 text-sm text-center py-6">
            Les tendances du moment s'afficheront ici.
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
            <span>MyFacebook © 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
