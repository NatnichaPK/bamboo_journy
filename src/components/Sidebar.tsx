import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  mobileSidebarOpen: boolean;
  handleLogout: () => void;
  dailyFortune: string;
  currentAmbience: string;
  gardenLevel: number;
  growthScore: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, mobileSidebarOpen, handleLogout, 
  dailyFortune, currentAmbience, gardenLevel, growthScore 
}) => {
  const flowers = ["🌱", "🌿", "🪴", "🎍", "🌸", "💐"];

  return (
    <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-container">
        <div className="sidebar-header"><div className="logo-section"><span className="logo-emoji">🌻</span><span className="brand-name">KOMOREBI</span></div></div>
        <nav className="nav-list-cozy">
          <div className={`nav-item-pill ${activeTab === 'todo' ? 'active' : ''}`} onClick={() => setActiveTab('todo')}><span className="icon">📝</span> <span className="nav-text">Missions</span></div>
          <div className={`nav-item-pill ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}><span className="icon">📖</span> <span className="nav-text">Journal</span></div>
          <div className={`nav-item-pill ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}><span className="icon">📚</span> <span className="nav-text">My Library</span></div>
          <div className={`nav-item-pill ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}><span className="icon">🏆</span> <span className="nav-text">Achievements</span></div>
        </nav>
        <div className="sidebar-footer-garden">
          <div className="sidebar-center">
            <div className="fortune-center">{dailyFortune}</div>
            <div className="music-player" style={{ marginTop: '10px' }}><div className="player-wrapper">
              <iframe title="Ambience" className="player-iframe" src={`https://www.youtube.com/embed/${currentAmbience}?autoplay=1&mute=0&loop=1&playlist=${currentAmbience}`} allow="autoplay; encrypted-media" />
            </div></div>
          </div>
          <div className="garden-status-pill">
            <span className="garden-icon">{flowers[gardenLevel]}</span>
            <div className="garden-meta">
              <span className="garden-lv">Garden Lv.{gardenLevel}</span>
              <div className="xp-track"><div className="xp-bar" style={{ width: `${((growthScore % 50) % 10) * 10}%` }}></div></div>
            </div>
          </div>
          <div className="logout-link-container"><span onClick={handleLogout} className="logout-text-link">ออกจากระบบ</span></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;