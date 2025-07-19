import { useState } from 'react';
import Navbar from '../components/Navbar';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import Feed from '../components/Feed';
import FriendsSection from '../components/Profile/FriendsSection';
import SavedPosts from '../components/SavedPosts';
import SectionComingSoon from '../components/SectionComingSoon';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'feed' | 'friends' | 'saved' | 'reels' | 'groupes' | 'pages' | 'evenements'
  >('feed');

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar - visible seulement sur mobile */}
        <div className="lg:hidden">
          <LeftSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onSectionChange={setActiveSection}
          />
        </div>
        {/* Desktop sidebar - visible seulement sur desktop */}
        <div className="h-full w-0 lg:w-80 flex-shrink-0 overflow-y-auto hidden lg:block">
          <LeftSidebar
            isOpen={true}
            onClose={() => {}}
            onSectionChange={setActiveSection}
          />
        </div>
        <main className="flex-1 h-full overflow-y-auto">
          <div className="flex h-full">
            <div className="flex-1 h-full overflow-y-auto">
              {activeSection === 'feed' ? (
                <Feed />
              ) : activeSection === 'friends' ? (
                <FriendsSection />
              ) : activeSection === 'saved' ? (
                <SavedPosts />
              ) : activeSection === 'reels' ? (
                <SectionComingSoon label="Reels" color="purple" icon="Play" />
              ) : activeSection === 'groupes' ? (
                <SectionComingSoon label="Groupes" color="blue" icon="Users" />
              ) : activeSection === 'pages' ? (
                <SectionComingSoon label="Pages" color="pink" icon="BookOpen" />
              ) : activeSection === 'evenements' ? (
                <SectionComingSoon
                  label="Évènements"
                  color="red"
                  icon="Calendar"
                />
              ) : null}
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
