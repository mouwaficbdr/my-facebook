import Avatar from './Avatar';

interface Friend {
  id: number;
  prenom: string;
  nom: string;
  photo_profil?: string | null;
}

interface FriendListProps {
  friends: Friend[];
  total: number;
  onSeeAll?: () => void;
  maxToShow?: number;
}

export default function FriendList({
  friends,
  total,
  onSeeAll,
  maxToShow = 8,
}: FriendListProps) {
  if (!friends || friends.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        Aucun ami à afficher.
      </div>
    );
  }
  const displayed = friends.slice(0, maxToShow);
  return (
    <section className="w-full bg-white/70 rounded-2xl shadow-md border border-blue-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Amis <span className="text-blue-600 font-semibold">({total})</span>
        </h3>
        {total > maxToShow && onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-blue-600 hover:underline font-medium text-sm"
          >
            Voir tous les amis
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {displayed.map((friend) => (
          <div
            key={friend.id}
            className="flex flex-col items-center group cursor-pointer"
          >
            <Avatar
              prenom={friend.prenom}
              nom={friend.nom}
              photo={friend.photo_profil}
              size={64}
              className="mb-2 shadow border-2 border-white group-hover:border-blue-400 transition"
            />
            <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 text-center truncate w-20">
              {friend.prenom} {friend.nom}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
