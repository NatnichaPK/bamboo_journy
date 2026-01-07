import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, Timestamp
} from "firebase/firestore";

// --- URL รูปภาพ ---
const SHELF_BG = "https://img5.pic.in.th/file/secure-sv1/Bookshelf-background.jpg";
const BOOK_SPINES = [
  "https://img2.pic.in.th/58a588a2438d7574f.png", "https://img2.pic.in.th/6472edacb5cc20989.png", 
  "https://img2.pic.in.th/10842f07c6c278370f.png", "https://img2.pic.in.th/118768cdd157fa09b0.png",
  "https://img2.pic.in.th/130f04f256e973ca64.png", "https://img2.pic.in.th/1c785628ac2e6e596.png", 
  "https://img2.pic.in.th/34a266bc929fd8425.png"
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'todo' | 'journal' | 'library' | 'achievements'>('todo');
  const [librarySubTab, setLibrarySubTab] = useState<'read' | 'tbr' | 'wish' | 'place'>('read');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);

  // --- Ref สำหรับเลื่อนหน้าจอไปยังฟอร์มแก้ไข ---
  const libraryFormRef = useRef<HTMLDivElement>(null);

  // Data States
  const [todos, setTodos] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [booksRead, setBooksRead] = useState<any[]>([]);
  const [booksWish, setBooksWish] = useState<any[]>([]);
  const [booksTBR, setBooksTBR] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);

  // UI States
  const [libTitle, setLibTitle] = useState('');
  const [libImage, setLibImage] = useState('');
  const [libExtra, setLibExtra] = useState('');
  const [libPrice, setLibPrice] = useState('');
  const [libRating, setLibRating] = useState(5);
  const [isLibEditing, setIsLibEditing] = useState(false);
  const [editLibId, setEditLibId] = useState<string | null>(null);
  const [selectedLibItem, setSelectedLibItem] = useState<any>(null);
  const [libModalOpen, setLibModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Input States
  const [todoInput, setTodoInput] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [mood, setMood] = useState('☀️');
  const [journalText, setJournalText] = useState('');
  const [journalType, setJournalType] = useState<'daily' | 'letter'>('daily');
  const [unlockDate, setUnlockDate] = useState('');
  const [dailyFortune, setDailyFortune] = useState('');
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  // Pomodoro States
  const [currentAmbience, setCurrentAmbience] = useState('JdqL89ZZwFw');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);

  // --- Effects ---
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
    }
  }, [user]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubTodos = onSnapshot(query(collection(db, "todos"), orderBy("createdAt", "desc")), (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((t:any) => !t.uid || t.uid === user.uid));
    });
    const unsubJournals = onSnapshot(query(collection(db, "journals"), orderBy("createdAt", "desc")), (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((j:any) => !j.uid || j.uid === user.uid));
    });
    const unsubRead = onSnapshot(query(collection(db, "booksRead"), orderBy("createdAt", "desc")), (snap) => {
      setBooksRead(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((b:any) => b.uid === user.uid));
    });
    const unsubWish = onSnapshot(query(collection(db, "booksWish"), orderBy("createdAt", "desc")), (snap) => {
      setBooksWish(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((b:any) => b.uid === user.uid));
    });
    const unsubTBR = onSnapshot(query(collection(db, "booksTBR"), orderBy("createdAt", "desc")), (snap) => {
      setBooksTBR(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((b:any) => b.uid === user.uid));
    });
    const unsubPlaces = onSnapshot(query(collection(db, "readingPlaces"), orderBy("createdAt", "desc")), (snap) => {
      setPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((p:any) => p.uid === user.uid));
    });
    return () => { unsubTodos(); unsubJournals(); unsubRead(); unsubWish(); unsubTBR(); unsubPlaces(); };
  }, [user]);

  useEffect(() => {
    let timer: any;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false); 
      if (timerMode === 'work') {
        alert("ครบเวลาโฟกัสแล้วค่ะ! พักผ่อน 5 นาทีนะคะ ☕");
        setTimerMode('break');
        setTimeLeft(5 * 60); 
      } else {
        alert("หมดเวลาพักแล้วค่ะ! กลับมาโฟกัสกันต่อเถอะ 🌳");
        setTimerMode('work');
        setTimeLeft(25 * 60); 
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, timerMode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const growthScore = (todos.filter(t => t.completed).length * 2) + (journals.length * 5) + (booksRead.length * 10);
  const gardenLevel = Math.min(Math.floor((growthScore % 50) / 10), 5);
  const flowers = ["🌱", "🌿", "🪴", "🎍", "🌸", "💐"];
  const gardenMasterCount = Math.floor(growthScore / 50);
  const bookBadgeCount = Math.floor(booksRead.length / 5);
  const journalBadgeCount = Math.floor(journals.length / 7);
  const achieverBadgeCount = Math.floor(todos.filter(t => t.completed && t.priority === 'high').length / 3);

  // --- Handlers ---
  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);
  const toggleTodo = async (id: string, completed: boolean) => await updateDoc(doc(db, "todos", id), { completed: !completed });
  
  const handleTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim() || !user) return;
    await addDoc(collection(db, "todos"), { task: todoInput, completed: false, priority, startDate, dueDate, createdAt: Timestamp.now(), uid: user.uid });
    setTodoInput(''); setStartDate(''); setDueDate('');
  };

  const addJournal = async () => {
    if (!journalText.trim() || !user) return;
    await addDoc(collection(db, "journals"), { content: journalText, mood, type: journalType, unlockDate: journalType === 'letter' ? unlockDate : null, createdAt: Timestamp.now(), uid: user.uid, opened: false });
    setJournalText(''); setUnlockDate('');
  };

  const markAsOpened = async (journal: any) => {
    if (journal.type === 'letter' && !journal.opened) {
      await updateDoc(doc(db, "journals", journal.id), { opened: true });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("รูปใหญ่เกินไปค่ะ เลือกรูปอื่นที่ขนาดเล็กกว่า 800KB นะคะ");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLibImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetLibForm = () => { setIsLibEditing(false); setEditLibId(null); setLibTitle(''); setLibImage(''); setLibExtra(''); setLibPrice(''); setLibRating(5); };
  
  const addLibraryItem = async () => {
    if (!libTitle.trim() || !user) return;
    const colMap = { read: "booksRead", tbr: "booksTBR", wish: "booksWish", place: "readingPlaces" };
    const data: any = { title: libTitle, image: libImage, createdAt: Timestamp.now(), uid: user.uid };
    if (librarySubTab === 'read') { data.rating = libRating; data.review = libExtra; }
    else if (librarySubTab === 'tbr') { data.note = libExtra; }
    else if (librarySubTab === 'wish') { data.price = Number(libPrice); data.reason = libExtra; }
    else { data.name = libTitle; data.location = libExtra; }
    await addDoc(collection(db, colMap[librarySubTab as keyof typeof colMap]), data);
    resetLibForm();
  };

  const startEditLib = (item: any, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsLibEditing(true); 
    setEditLibId(item.id);
    setLibTitle(item.title || item.name); 
    setLibImage(item.image);
    setLibExtra(item.review || item.reason || item.location || item.note);
    setLibPrice(item.price || ''); 
    setLibRating(item.rating || 5);

    // --- เลื่อนหน้าจอไปที่ฟอร์มแก้ไข ---
    libraryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveEditLib = async () => {
    if (!editLibId || !user) return;
    const colMap = { read: "booksRead", tbr: "booksTBR", wish: "booksWish", place: "readingPlaces" };
    const updateData: any = { image: libImage, createdAt: Timestamp.now() };
    if (librarySubTab === 'read') { updateData.title = libTitle; updateData.review = libExtra; updateData.rating = libRating; }
    else if (librarySubTab === 'tbr') { updateData.title = libTitle; updateData.note = libExtra; }
    else if (librarySubTab === 'wish') { updateData.title = libTitle; updateData.price = Number(libPrice); updateData.reason = libExtra; }
    else { updateData.name = libTitle; updateData.location = libExtra; }
    await updateDoc(doc(db, colMap[librarySubTab as keyof typeof colMap], editLibId), updateData);
    resetLibForm();
  };

  const triggerDelete = (col: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({ id, collection: col }); setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteDoc(doc(db, deleteTarget.collection, deleteTarget.id));
      setDeleteModalOpen(false); setDeleteTarget(null);
    }
  };

  if (!user) return (
    <div className="login-screen"><div className="login-card">
      <span style={{ fontSize: '4rem' }}>🌻</span><h1>Bamboo's Book</h1>
      <button onClick={handleLogin} className="action-btn-main login-btn">Login with Google 🚀</button>
    </div></div>
  );

  return (
    <div className={`app-layout sidebar-expanded ${isNight ? 'night-theme' : 'day-theme'} ${mobileSidebarOpen ? 'sidebar-toggle-visible' : ''}`}>
      <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-container">
          <div className="sidebar-header"><div className="logo-section"><span className="logo-emoji">🌻</span><span className="brand-name">Bamboo's Book</span></div></div>
          <nav className="nav-list-cozy">
            <div className={`nav-item-pill ${activeTab === 'todo' ? 'active' : ''}`} onClick={() => setActiveTab('todo')}><span className="icon">📝</span> <span className="nav-text">Missions</span></div>
            <div className={`nav-item-pill ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}><span className="icon">📖</span> <span className="nav-text">Journal</span></div>
            <div className={`nav-item-pill ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}><span className="icon">📚</span> <span className="nav-text">My Library</span></div>
            <div className={`nav-item-pill ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}><span className="icon">🏆</span> <span className="nav-text">Achievements</span></div>
          </nav>
          <div className="sidebar-footer-garden">
            <div className="sidebar-center">
              <div className="fortune-center">{dailyFortune}</div>
              <div className="music-player" style={{marginTop: '10px'}}><div className="player-wrapper">
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

      <main className="main-content">
        <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(v => !v)}>☰</button>
        <div className="cover-box"><img src="https://i.pinimg.com/originals/bd/3b/3f/bd3b3ff5565be74a9c8bba681dde7fdd.gif" className="cover-img" alt="cover" /></div>

        <div className="scroll-area">
          <div className="inner-content">
            
            {activeTab === 'todo' && (
              <section className="fade-section">
                <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h1>Missions</h1><p>มีอะไรต้องทำอีกเยอะเลย สู้!! ✨</p></div>
                  <div className="ambience-selector" style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setCurrentAmbience('JdqL89ZZwFw')} className="ambience-btn" title="Lo-fi Cozy">☕</button>
                    <button onClick={() => setCurrentAmbience('CHFif_y2TyM')} className="ambience-btn" title="Rain Sounds">🌧️</button>
                    <button onClick={() => setCurrentAmbience('oGtH8v0qVBc')} className="ambience-btn" title="Cafe Ambience">🍰</button>
                  </div>
                </header>
                <div className="cozy-card">
                  <form onSubmit={handleTodoSubmit}>
                    <div className="input-row"><input type="text" className="full-input" placeholder="ต้องทำอะไรมั้ยวันนี้?" value={todoInput} onChange={(e) => setTodoInput(e.target.value)} /><button type="submit" className="action-btn-main">เพิ่ม</button></div>
                    <div className="date-row">
                      <label className="date-label"><span>ต้องทำ</span><input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
                      <label className="date-label"><span>ต้องเสร็จ</span><input type="date" className="date-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
                    </div>
                    <div className="pill-selector">
                      {(['low', 'medium', 'high'] as const).map(p => (<button key={p} type="button" className={`pill-btn ${priority === p ? `active-${p}` : ''}`} onClick={() => setPriority(p)}>{p === 'low' ? 'ชิลล์ 🌸' : p === 'medium' ? 'ปกติ ✉️' : 'ด่วน 🔥'}</button>))}
                    </div>
                  </form>
                </div>
                <div className="items-list">
                  {todos.map(t => (
                    <div key={t.id} className={`item-card border-${t.priority} ${t.completed ? 'done' : ''}`}>
                      <div className="item-left">
                        <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)} className="circle-check" />
                        <div className="item-info">
                          <span className="item-task">{t.task}</span>
                          {t.dueDate && <span className="item-dates">⏰ {new Date(t.dueDate).toLocaleDateString('th-TH')}</span>}
                        </div>
                      </div>
                      <button onClick={() => triggerDelete("todos", t.id)} className="icon-btn">🗑️</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'journal' && (
              <section className="fade-section">
                <header className="page-header"><h1>Diary</h1></header>
                <div className="cozy-card">
                  <div className="pill-selector type-toggle">
                    <button className={`pill-btn ${journalType === 'daily' ? 'active-diary' : ''}`} onClick={() => setJournalType('daily')}>บันทึกทั่วไป ✨</button>
                    <button className={`pill-btn ${journalType === 'letter' ? 'active-letter' : ''}`} onClick={() => setJournalType('letter')}>จดหมายถึงอนาคต 📮</button>
                  </div>
                  <div className="mood-strip">
                    {['☀️', '🌧️', '✨', '💤','🎧','😎','🌻','🤣'].map(m => (<button key={m} className={`mood-item ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>))}
                    {journalType === 'letter' && <input type="date" className="date-picker-soft" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />}
                    <button onClick={addJournal} className="action-btn-save mood-save-btn">บันทึกเรื่องราวดีๆ 🫶</button>
                  </div>
                  <textarea className="text-area-cozy" placeholder="เล่าเรื่องวันนี้ให้ฟังหน่อย..." value={journalText} onChange={(e) => setJournalText(e.target.value)}></textarea>
                </div>
                <div className="journal-grid">
                  {journals.map((j) => {
                    const isReady = j.type === 'letter' && j.unlockDate && new Date(j.unlockDate).getTime() <= new Date().setHours(0,0,0,0) && !j.opened;
                    const isLocked = j.type === 'letter' && j.unlockDate && new Date(j.unlockDate).getTime() > new Date().setHours(0,0,0,0);
                    return (
                      <div key={j.id} className={`journal-card ${isReady ? 'ready-to-open' : ''}`} onClick={() => { if (isLocked) return alert(`เปิดวันที่ ${new Date(j.unlockDate!).toLocaleDateString('th-TH')}`); markAsOpened(j); setSelectedJournal(j); setJournalModalOpen(true); }} style={{ position: 'relative', overflow: 'visible' }}>
                        <div className="card-top">
                          <div style={{ position: 'absolute', top: '5px', right: '5px' }}>{isReady && <span>✨</span>}{j.opened && <span style={{ color: '#FFD700' }}>⭐</span>}</div>
                          <span style={{ fontSize: '3.5rem' }}>{isLocked ? '🔒' : '💌'}</span>
                          <div className="mood-date-row"><span>{j.mood}</span><span className="card-date">{j.createdAt?.toDate().toLocaleDateString('th-TH')}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'library' && (
              <section className="fade-section">
                <header className="page-header"><h1>My Library</h1>
                  <div className="pill-selector type-toggle">
                    <button className={`pill-btn ${librarySubTab === 'read' ? 'active-library-sub' : ''}`} onClick={() => {setLibrarySubTab('read'); resetLibForm();}}>อ่านแล้ว ✨</button>
                    <button className={`pill-btn ${librarySubTab === 'tbr' ? 'active-library-sub' : ''}`} onClick={() => {setLibrarySubTab('tbr'); resetLibForm();}}>กองดอง 📚</button>
                    <button className={`pill-btn ${librarySubTab === 'wish' ? 'active-library-sub' : ''}`} onClick={() => {setLibrarySubTab('wish'); resetLibForm();}}>อยากอ่าน 📮</button>
                    <button className={`pill-btn ${librarySubTab === 'place' ? 'active-library-sub' : ''}`} onClick={() => {setLibrarySubTab('place'); resetLibForm();}}>อยากไปนั่งอ่าน 📍</button>
                  </div>
                </header>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: '30px', marginBottom: '30px' }}>
                  <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
                    <div className="bookshelf-container" style={{ aspectRatio: '2/3.5', backgroundSize: '100% 100%', backgroundImage: `url(${SHELF_BG})`, position: 'relative' }}>
                        {booksRead.map((book, idx) => (<img key={book.id} src={BOOK_SPINES[idx % BOOK_SPINES.length]} className="spine-on-shelf" style={{ position: 'absolute', height: '14%', top: `${14 + (Math.floor(idx / 12) * 15.8)}%`, left: `${12 + ((idx % 12) * 3.5)}%`, transform: 'translateY(-80%)' }} />))}
                    </div>
                  </div>
                  <div className="cozy-card" style={{ flex: 1 }} ref={libraryFormRef}>
                    <div style={{ display: 'flex', gap: '20px', flexDirection: window.innerWidth < 480 ? 'column' : 'row' }}>
                      <div onClick={() => document.getElementById('img-up')?.click()} style={{ width: '120px', height: '160px', border: '2px dashed #ddd', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#f9f9f9', alignSelf: 'flex-start' }}>
                        {libImage ? <img src={libImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>📸</span>}
                      </div>
                      <input id="img-up" type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      <div style={{ flex: 1 }}>
                        <input type="text" className="full-input" placeholder="ชื่อหนังสือ" value={libTitle} onChange={(e) => setLibTitle(e.target.value)} />
                        <div style={{ fontSize: '0.8rem', color: '#999', margin: '5px 0' }}>{libImage ? '✅ เลือกรูปแล้ว' : '☝️ กดที่กล้องเพื่ออัปโหลด'}</div>
                        {librarySubTab === 'read' && <div>Rating: {[1,2,3,4,5].map(s => <span key={s} onClick={() => setLibRating(s)} style={{ cursor: 'pointer', color: s <= libRating ? 'gold' : '#ccc' }}>⭐</span>)}</div>}
                        <textarea className="text-area-cozy" placeholder="Dump Text..." value={libExtra} onChange={(e) => setLibExtra(e.target.value)} />
                        <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                          <button onClick={isLibEditing ? saveEditLib : addLibraryItem} className="action-btn-main">{isLibEditing ? 'บันทึกแก้ไข' : 'เพิ่มลงคลัง'}</button>
                          {isLibEditing && <button onClick={resetLibForm} className="action-btn-main" style={{background:'#ccc'}}>ยกเลิก</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="library-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                  {(librarySubTab === 'read' ? booksRead : librarySubTab === 'tbr' ? booksTBR : librarySubTab === 'wish' ? booksWish : places).map((item: any) => (
                    <div key={item.id} className="lib-mini-card" onClick={() => {setSelectedLibItem(item); setLibModalOpen(true);}}>
                      <div style={{ aspectRatio: '3/4', background: '#f5f5f5' }}>{item.image && <img src={item.image} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                      <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <b style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{item.title || item.name}</b>
                        <div style={{ display: 'flex', gap: '5px' }}><span onClick={(e) => startEditLib(item, e)}>✏️</span><span onClick={(e) => triggerDelete(librarySubTab === 'read' ? 'booksRead' : 'booksTBR', item.id, e)}>🗑️</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'achievements' && (
              <section className="fade-section">
                <header className="page-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                    <div><h1>My Achievements</h1><p>รางวัลของคนสม่ำเสมอ ✨</p></div>
                    <div style={{ position: 'relative' }}>
                      <div onClick={() => setShowScoreDetail(!showScoreDetail)} style={{ background: 'var(--sidebar)', padding: '10px 18px', borderRadius: '20px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>คะแนนรวม ▾</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{growthScore} คะแนน</div>
                      </div>
                      {showScoreDetail && (
                        <div className="score-dropdown" style={{ 
                          position: 'absolute', top: '110%', right: 0, zIndex: 50,
                          background: 'white', padding: '15px', borderRadius: '18px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '220px',
                          border: '1px solid #f0f0f0', animation: 'fadeInDown 0.3s ease-out'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>รายละเอียดคะแนน ✨</h4>
                          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>📝 Missions (x2):</span> <b>{todos.filter(t => t.completed).length * 2}</b></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>📖 Diary (x5):</span> <b>{journals.length * 5}</b></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>📚 Books (x10):</span> <b>{booksRead.length * 10}</b></div>
                          </div>
                          <hr style={{ margin: '12px 0', border: '0.5px solid #eee' }} />
                          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999', cursor: 'pointer' }} onClick={() => setShowScoreDetail(false)}>ปิดหน้าต่าง</div>
                        </div>
                      )}
                    </div>
                  </div>
                </header>
                <div className="achievement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  <div className="cozy-card" style={{ textAlign: 'center', opacity: bookBadgeCount > 0 ? 1 : 0.4 }}><div style={{ fontSize: '3.5rem' }}>🐛</div><h3>หนอนหนังสือ</h3><p>{bookBadgeCount} ดวง</p></div>
                  <div className="cozy-card" style={{ textAlign: 'center', opacity: journalBadgeCount > 0 ? 1 : 0.4 }}><div style={{ fontSize: '3.5rem' }}>✍️</div><h3>นักบันทึก</h3><p>{journalBadgeCount} ดวง</p></div>
                  <div className="cozy-card" style={{ textAlign: 'center', opacity: achieverBadgeCount > 0 ? 1 : 0.4 }}><div style={{ fontSize: '3.5rem' }}>🔥</div><h3>นักพิชิต</h3><p>{achieverBadgeCount} ดวง</p></div>
                  <div className="cozy-card" style={{ textAlign: 'center', opacity: gardenMasterCount > 0 ? 1 : 0.4, border: gardenMasterCount > 0 ? '2px solid #B8DB80' : 'none' }}><div style={{ fontSize: '3.5rem' }}>👑</div><h3>Garden Master</h3><p>{gardenMasterCount} รอบ</p></div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="focus-timer-floating" style={{
          position: 'fixed', bottom: '25px', right: '25px', zIndex: 1000,
          background: timerMode === 'work' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(235, 248, 255, 0.98)',
          padding: isTimerExpanded ? '16px 22px' : '0', 
          borderRadius: isTimerExpanded ? '30px' : '50%', 
          border: timerMode === 'work' ? '2px solid #B8DB80' : '2px solid #80C6DB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: isTimerExpanded ? '18px' : '0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflow: 'hidden',
          width: isTimerExpanded ? 'auto' : '65px',
          height: isTimerExpanded ? 'auto' : '65px'
        }} onClick={() => !isTimerExpanded && setIsTimerExpanded(true)}>
          <span style={{ fontSize: isTimerExpanded ? '2.2rem' : '1.8rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }} 
            className={!isTimerExpanded && isTimerRunning ? 'breathing-icon' : ''}
            onClick={(e) => { if(isTimerExpanded) { e.stopPropagation(); setIsTimerExpanded(false); } }}>
            {timerMode === 'work' ? '🌳' : '☕'}
          </span>
          {isTimerExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', animation: 'fadeInScale 0.4s ease-out' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#555' }}>{formatTime(timeLeft)}</div>
              <button onClick={(e) => { e.stopPropagation(); setIsTimerRunning(!isTimerRunning); }} 
                className="timer-main-btn"
                style={{ background: timerMode === 'work' ? '#B8DB80' : '#80C6DB', color: 'white', border: 'none', borderRadius: '14px', padding: '8px 16px', fontWeight: 'bold' }}>
                {isTimerRunning ? 'Pause' : 'Start'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsTimerRunning(false); setTimeLeft(timerMode === 'work' ? 25*60 : 5*60); }} 
                style={{background:'none', border:'none', cursor:'pointer', fontSize: '1.2rem', opacity: 0.6}}>↺</button>
              <button onClick={(e) => { e.stopPropagation(); setIsTimerExpanded(false); }} 
                style={{ fontSize: '1rem', opacity: 0.3, background:'none', border:'none', marginLeft: '5px' }}>✕</button>
            </div>
          )}
          {!isTimerExpanded && isTimerRunning && (
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FF6B6B', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', animation: 'pulse 2s infinite' }}></div>
          )}
        </div>

        {deleteModalOpen && (
          <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
            <div className="journal-modal" onClick={e => e.stopPropagation()}>
              <div className="note-card" style={{ textAlign: 'center' }}>
                <h3>จะลบใช่มั้ย กดผิดรึป่าว? 🗑️</h3>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button className="cancel-btn-styled" onClick={() => setDeleteModalOpen(false)}>ยกเลิก</button>
                  <button className="action-btn-main" onClick={confirmDelete} style={{ background: '#e29a9a', color:'white' }}>ลบเลย</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;