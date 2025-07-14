import { useState } from 'react';
import Navbar from '../components/Navbar';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import Feed from '../components/Feed';
import FriendsSection from '../components/Profile/FriendsSection';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'feed' | 'friends'>(
    'feed'
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="h-full w-0 lg:w-80 flex-shrink-0 overflow-y-auto hidden lg:block">
          <LeftSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onSectionChange={setActiveSection}
          />
        </div>
        <main className="flex-1 h-full overflow-y-auto">
          <div className="flex h-full">
            <div className="flex-1 h-full overflow-y-auto">
              {activeSection === 'feed' ? <Feed /> : <FriendsSection />}
            </div>
            <div className="h-full w-0 xl:w-80 flex-shrink-0 overflow-y-auto hidden xl:block">
              <RightSidebar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
