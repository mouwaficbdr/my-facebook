import Avatar from './Avatar';
import ActionButton from './ActionButton';
import { MapPin, Calendar } from 'lucide-react';

type FriendStatus =
  | 'self'
  | 'not_friends'
  | 'request_sent'
  | 'request_received'
  | 'friends';

interface ProfileHeaderProps {
  prenom: string;
  nom: string;
  bio?: string;
  photo_profil?: string | null;
  cover_url?: string | null;
  ville?: string;
  pays?: string;
  date_naissance?: string;
  stats: {
    friends: number;
    posts: number;
    mutualFriends: number;
  };
  friendStatus: FriendStatus;
  userId: number;
  onFriendStatusChange: (status: FriendStatus) => void;
  onMessage?: () => void;
  onFriendsClick?: () => void;
}

export default function ProfileHeader({
  prenom,
  nom,
  bio,
  photo_profil,
  cover_url,
  ville,
  pays,
  date_naissance,
  stats,
  friendStatus,
  userId,
  onFriendStatusChange,
  onMessage,
  onFriendsClick,
}: ProfileHeaderProps) {
  return (
    <section
      className="w-full bg-blue-50/90 backdrop-blur-md rounded-3xl shadow-xl border border-blue-100 flex flex-col md:flex-row items-center md:items-stretch gap-12 p-8 md:p-16 min-h-[340px] md:min-h-[420px] animate-fade-in -mt-12 md:-mt-16 z-10 relative"
      style={{ paddingTop: '6.5rem' }}
    >
      {/* Cover photo (optionnelle) */}
      {cover_url && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden z-0">
          <img
            src={cover_url}
            alt="Cover"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
      )}
      {/* Avatar + actions */}
      <div className="flex-shrink-0 flex flex-col items-center md:items-start justify-center h-full z-10">
        <Avatar
          prenom={prenom}
          nom={nom}
          photo={photo_profil}
          size={148}
          className="mb-6 shadow-2xl border-4 border-white"
        />
        <div className="flex flex-row gap-2 w-full justify-center md:justify-start">
          <ActionButton
            userId={userId}
            status={friendStatus}
            onStatusChange={onFriendStatusChange}
          />
          {friendStatus === 'friends' && (
            <button
              onClick={onMessage}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-lg shadow-sm border border-blue-100 transition cursor-pointer"
            >
              Message
            </button>
          )}
        </div>
      </div>
      {/* Infos principales */}
      <div className="flex-1 flex flex-col justify-center h-full gap-6 z-10">
        <div className="flex flex-col items-center md:items-start gap-2 w-full">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center md:text-left w-full">
            {prenom} {nom}
          </h2>
          {/* Infos additionnelles modernes */}
          {(ville || pays || date_naissance) && (
            <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start mt-1 mb-1">
              {ville || pays ? (
                <span className="flex items-center gap-1 bg-white/70 border border-blue-100 rounded-full px-3 py-1 text-blue-700 font-medium shadow-sm backdrop-blur-md">
                  <MapPin
                    className="w-4 h-4 text-blue-400"
                    aria-label="Localisation"
                  />
                  <span>
                    {ville}
                    {ville && pays ? ', ' : ''}
                    {pays}
                  </span>
                </span>
              ) : null}
              {date_naissance && (
                <span className="flex items-center gap-1 bg-white/70 border border-violet-100 rounded-full px-3 py-1 text-violet-700 font-medium shadow-sm backdrop-blur-md">
                  <Calendar
                    className="w-4 h-4 text-violet-400"
                    aria-label="Date de naissance"
                  />
                  <span>{formatDateFr(date_naissance)}</span>
                </span>
              )}
            </div>
          )}
          <div className="w-full flex items-center justify-center md:justify-start min-h-[48px]">
            {bio ? (
              <p className="text-gray-700 text-xl text-center md:text-left max-w-2xl w-full">
                {bio}
              </p>
            ) : (
              <span className="italic text-gray-400 text-lg">
                Aucune bio renseignée.
              </span>
            )}
          </div>
        </div>
        {/* Stats */}
        <div className="flex flex-wrap gap-3 my-2 justify-center md:justify-start">
          <span
            className={
              `bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center transition ` +
              (onFriendsClick
                ? 'cursor-pointer hover:bg-blue-200 hover:shadow-md'
                : '')
            }
            onClick={onFriendsClick}
            tabIndex={onFriendsClick ? 0 : undefined}
            role={onFriendsClick ? 'button' : undefined}
            aria-label={onFriendsClick ? 'Voir la liste des amis' : undefined}
          >
            <svg
              className="w-4 h-4 mr-1 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-7a4 4 0 11-8 0 4 4 0 018 0zm6 13v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87"
              />
            </svg>
            {stats.friends} ami{stats.friends !== 1 ? 's' : ''}
          </span>
          <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-violet-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
              />
            </svg>
            {stats.posts} post{stats.posts !== 1 ? 's' : ''}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-7a4 4 0 11-8 0 4 4 0 018 0zm6 13v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87"
              />
            </svg>
            {stats.mutualFriends} ami{stats.mutualFriends !== 1 ? 's' : ''} en
            commun
          </span>
        </div>
      </div>
    </section>
  );
}

function formatDateFr(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
