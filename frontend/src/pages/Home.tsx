import { useState } from 'react';
import Navbar from '../components/Navbar';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import Feed from '../components/Feed';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <button
        onClick={logout}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
      >
        Déconnexion
      </button>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0 overflow-hidden">
          <div className="flex h-full">
            <Feed />
            <RightSidebar />
          </div>
        </main>
      </div>
    </div>
  );
}
