import { useState, useRef, useEffect } from 'react';
import { fetchUsers } from '../api/users';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ReactDOM from 'react-dom';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

export default function UserSearchBar() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigate = useNavigate();
  // Pour le portal dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
  }>({ left: 0, top: 0, width: 0 });

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(query)
        .then((users) => {
          setResults(users);
          setShowDropdown(true);
        })
        .catch((err) => {
          setError(err.message);
          setResults([]);
          setShowDropdown(false);
          toast.error(err.message || 'Erreur lors de la recherche utilisateur');
        });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        left: rect.left,
        top: rect.bottom + window.scrollY,
        width: rect.width,
      });
    }
  }, [showDropdown, results.length]);

  // Fermer dropdown si clic en dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!inputRef.current?.parentElement?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Autofocus sur mobile/overlay
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          className="block w-full rounded-full border border-gray-200 bg-gray-50 py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 shadow-sm md:w-72"
          placeholder="Rechercher des utilisateurs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(results.length > 0)}
        />
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {/* Dropdown résultats en portal */}
      {showDropdown &&
        results.length > 0 &&
        (() => {
          const isMobile = window.innerWidth < 768;
          const dropdown = (
            <div
              ref={dropdownRef}
              className="bg-white border border-gray-200 rounded-xl shadow-lg z-[1000] max-h-72 overflow-y-auto w-full"
              style={{
                position: isMobile ? 'relative' : 'absolute',
                left: isMobile ? undefined : dropdownPos.left,
                top: isMobile ? undefined : dropdownPos.top,
                width: isMobile ? '100%' : dropdownPos.width,
                background: 'white',
                pointerEvents: 'auto',
              }}
            >
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => {
                    setShowDropdown(false);
                    setQuery('');
                    if (user && user.id === result.id) {
                      navigate('/me');
                    } else {
                      navigate(`/profile/${result.id}`);
                    }
                  }}
                >
                  <Avatar
                    userId={result.id}
                    prenom={result.prenom}
                    nom={result.nom}
                    photo={result.photo_profil}
                    size={32}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {result.prenom} {result.nom}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
          if (isMobile) {
            return dropdown;
          } else if (
            typeof window !== 'undefined' &&
            typeof document !== 'undefined'
          ) {
            return ReactDOM.createPortal(dropdown, document.body);
          } else {
            return null;
          }
        })()}
    </div>
  );
}
