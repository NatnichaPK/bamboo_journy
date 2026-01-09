import React, { useState, useEffect } from 'react';
import './App.css';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";

import Sidebar from './components/Sidebar';
import FocusTimer from './components/FocusTimer';
import MissionList from './features/MissionList';
import JournalList from './features/JournalList';
import Library from './features/Library';
import Achievements from './features/Achievements';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'todo' | 'journal' | 'library' | 'achievements'>('todo');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);
  
  // States for Global Sidebar Data (Garden & Music)
  const [currentAmbience, setCurrentAmbience] = useState('JdqL89ZZwFw');
  const [dailyFortune, setDailyFortune] = useState('');
  
  // Data for Sidebar Garden Score (Still needed in App or Sidebar to display Level)
  const [todos, setTodos] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [booksRead, setBooksRead] = useState<any[]>([]);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 17 || hour < 6);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      const msgs = ["วันนี้จะมีเรื่องดีๆ นะ🌻", "พักบ้างนะ🛏️", "ท้องฟ้าสวยจัง🌇", "ยิ้มหน่อยนะ 😊", "ขอให้วันนี้เป็นวันที่ดี!☀️", "คุณเก่งที่สุดเลย🌟", "ดื่มน้ำเยอะๆ นะ💧"];
      setDailyFortune(msgs[Math.floor(Math.random() * msgs.length)]);
      
      // Fetch data specifically for Sidebar Garden Level display
      const unsubTodos = onSnapshot(query(collection(db, "todos")), (snap) => {
         setTodos(snap.docs.map(d => ({ ...d.data() })).filter((t:any) => !t.uid || t.uid === user.uid));
      });
      const unsubJournals = onSnapshot(query(collection(db, "journals")), (snap) => {
         setJournals(snap.docs.map(d => ({ ...d.data() })).filter((j:any) => !j.uid || j.uid === user.uid));
      });
      const unsubRead = onSnapshot(query(collection(db, "booksRead")), (snap) => {
         setBooksRead(snap.docs.map(d => ({ ...d.data() })).filter((b:any) => b.uid === user.uid));
      });
      return () => { unsubTodos(); unsubJournals(); unsubRead(); };
    }
  }, [user]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubAuth();
  }, []);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const growthScore = (todos.filter(t => t.completed).length * 2) + (journals.length * 5) + (booksRead.length * 10);
  const gardenLevel = Math.min(Math.floor((growthScore % 50) / 10), 5);

  if (!user) return (
    <div className="login-screen"><div className="login-card">
      <span style={{ fontSize: '4rem' }}>🌻</span><h1>Bamboo's Book</h1>
      <button onClick={handleLogin} className="action-btn-main login-btn">Login with Google 🚀</button>
    </div></div>
  );

  return (
    <div className={`app-layout sidebar-expanded ${isNight ? 'night-theme' : 'day-theme'} ${mobileSidebarOpen ? 'sidebar-toggle-visible' : ''}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileSidebarOpen={mobileSidebarOpen}
        handleLogout={handleLogout}
        dailyFortune={dailyFortune}
        currentAmbience={currentAmbience}
        gardenLevel={gardenLevel}
        growthScore={growthScore}
      />

      <main className="main-content">
        <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(v => !v)}>☰</button>
        <div className="cover-box"><img src="https://i.pinimg.com/originals/bd/3b/3f/bd3b3ff5565be74a9c8bba681dde7fdd.gif" className="cover-img" alt="cover" /></div>

        <div className="scroll-area">
          <div className="inner-content">
            {activeTab === 'todo' && <MissionList user={user} setCurrentAmbience={setCurrentAmbience} />}
            {activeTab === 'journal' && <JournalList user={user} />}
            {activeTab === 'library' && <Library user={user} />}
            {activeTab === 'achievements' && <Achievements user={user} />}
          </div>
        </div>

        <FocusTimer />
      </main>
    </div>
  );
}

export default App;