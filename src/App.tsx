import React, { useState, useEffect } from 'react';
import './App.css';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, Timestamp
} from "firebase/firestore";

// --- URL รูปภาพ (นำ URL ที่ได้จากการอัปโหลดมาวางที่นี่ค่ะ) ---
const SHELF_BG = "URL_ของ_Bookshelf_background.jpg";
const TBR_BOOK_IMG = "URL_ของ_กองดองแนวนอน_จากรูปแรกสุด";
const BOOK_SPINES = [
  "URL_1.png", "URL_2.png", "URL_3.png", "URL_5.png", 
  "URL_6.jpg", "URL_11.png", "URL_12.png", "URL_13.png", "URL_14.png"
];

// --- Interfaces ---
interface Todo { id: string; task: string; completed: boolean; priority: 'high' | 'medium' | 'low'; startDate?: string; dueDate?: string; createdAt: any; uid?: string; }
interface Journal { id: string; content: string; mood: string; type: 'daily' | 'letter'; unlockDate?: string; createdAt: any; uid?: string; }
interface BookRead { id: string; title: string; image: string; rating: number; review: string; createdAt: any; uid: string; }
interface BookWish { id: string; title: string; image: string; price: number; reason: string; createdAt: any; uid: string; }
interface BookTBR { id: string; title: string; image: string; note: string; createdAt: any; uid: string; }
interface ReadingPlace { id: string; name: string; image: string; location: string; reason: string; createdAt: any; uid: string; }

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'todo' | 'journal' | 'library'>('todo');
  const [librarySubTab, setLibrarySubTab] = useState<'read' | 'tbr' | 'wish' | 'place'>('read');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [booksRead, setBooksRead] = useState<BookRead[]>([]);
  const [booksWish, setBooksWish] = useState<BookWish[]>([]);
  const [booksTBR, setBooksTBR] = useState<BookTBR[]>([]);
  const [places, setPlaces] = useState<ReadingPlace[]>([]);

  const [libTitle, setLibTitle] = useState('');
  const [libImage, setLibImage] = useState('');
  const [libExtra, setLibExtra] = useState('');
  const [libPrice, setLibPrice] = useState('');
  const [libRating, setLibRating] = useState(5);
  const [isLibEditing, setIsLibEditing] = useState(false);
  const [editLibId, setEditLibId] = useState<string | null>(null);

  const [todoInput, setTodoInput] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [mood, setMood] = useState('☀️');
  const [journalText, setJournalText] = useState('');
  const [journalType, setJournalType] = useState<'daily' | 'letter'>('daily');
  const [unlockDate, setUnlockDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [deleteTodoId, setDeleteTodoId] = useState<string | null>(null);
  const [deleteTodoModalOpen, setDeleteTodoModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubAuth();
  }, []);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  useEffect(() => {
    if (!user) return;
    const hour = new Date().getHours();
    setIsNight(hour >= 17 || hour < 6);

    const qTodos = query(collection(db, "todos"), orderBy("createdAt", "desc"));
    const unsubTodos = onSnapshot(qTodos, (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo)).filter(t => !t.uid || t.uid === user.uid));
    });

    const qJournals = query(collection(db, "journals"), orderBy("createdAt", "desc"));
    const unsubJournals = onSnapshot(qJournals, (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Journal)).filter(j => !j.uid || j.uid === user.uid));
    });

    const unsubRead = onSnapshot(query(collection(db, "booksRead"), orderBy("createdAt", "desc")), (snap) => {
      setBooksRead(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookRead)).filter(b => b.uid === user.uid));
    });
    const unsubWish = onSnapshot(query(collection(db, "booksWish"), orderBy("createdAt", "desc")), (snap) => {
      setBooksWish(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookWish)).filter(b => b.uid === user.uid));
    });
    const unsubTBR = onSnapshot(query(collection(db, "booksTBR"), orderBy("createdAt", "desc")), (snap) => {
      setBooksTBR(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookTBR)).filter(b => b.uid === user.uid));
    });
    const unsubPlaces = onSnapshot(query(collection(db, "readingPlaces"), orderBy("createdAt", "desc")), (snap) => {
      setPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReadingPlace)).filter(p => p.uid === user.uid));
    });

    return () => { unsubTodos(); unsubJournals(); unsubRead(); unsubWish(); unsubTBR(); unsubPlaces(); };
  }, [user]);

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const msgs = ["วันนี้จะมีเรื่องดีๆ นะ🌻", "พักบ้างนะ🛏️", "ท้องฟ้าสวยจัง🌇", "ยิ้มหน่อยนะ 😊", "ขอให้วันนี้เป็นวันที่ดี!☀️"];
  const seed = new Date().toDateString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const dailyFortune = msgs[seed % msgs.length];

  const handleTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim() || !user) return;
    await addDoc(collection(db, "todos"), { task: todoInput, completed: false, priority, startDate, dueDate, createdAt: Timestamp.now(), uid: user.uid });
    setTodoInput(''); setStartDate(''); setDueDate('');
  };

  const addJournal = async () => {
    if (!journalText.trim() || !user) return;
    await addDoc(collection(db, "journals"), { content: journalText, mood, type: journalType, unlockDate: journalType === 'letter' ? unlockDate : null, createdAt: Timestamp.now(), uid: user.uid });
    setJournalText(''); setUnlockDate(''); alert("บันทึกเรียบร้อยแล้ว ✨");
  };

  const addLibraryItem = async () => {
    if (!libTitle.trim() || !user) return;
    const commonData = { title: libTitle, image: libImage, createdAt: Timestamp.now(), uid: user.uid };
    const colMap = { read: "booksRead", tbr: "booksTBR", wish: "booksWish", place: "readingPlaces" };
    const colName = colMap[librarySubTab];
    let data: any = { ...commonData };
    if (librarySubTab === 'read') { data.rating = libRating; data.review = libExtra; }
    else if (librarySubTab === 'tbr') { data.note = libExtra; }
    else if (librarySubTab === 'wish') { data.price = Number(libPrice); data.reason = libExtra; }
    else { data.name = libTitle; data.location = libExtra; }
    await addDoc(collection(db, colName), data);
    resetLibForm();
  };

  const deleteLibItem = async (col: string, id: string) => { if (window.confirm("ลบรายการนี้ใช่ไหม?")) await deleteDoc(doc(db, col, id)); };

  const startEditLib = (item: any) => {
    setIsLibEditing(true); setEditLibId(item.id);
    setLibTitle(item.title || item.name); setLibImage(item.image);
    setLibExtra(item.review || item.reason || item.location || item.note);
    setLibPrice(item.price || ''); setLibRating(item.rating || 5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveEditLib = async () => {
    if (!editLibId) return;
    const colMap = { read: "booksRead", tbr: "booksTBR", wish: "booksWish", place: "readingPlaces" };
    const colName = colMap[librarySubTab];
    const updateData: any = { image: libImage, createdAt: Timestamp.now() };
    if (librarySubTab === 'read') { updateData.title = libTitle; updateData.review = libExtra; updateData.rating = libRating; }
    else if (librarySubTab === 'tbr') { updateData.title = libTitle; updateData.note = libExtra; }
    else if (librarySubTab === 'wish') { updateData.title = libTitle; updateData.price = Number(libPrice); updateData.reason = libExtra; }
    else { updateData.name = libTitle; updateData.location = libExtra; }
    await updateDoc(doc(db, colName, editLibId), updateData);
    resetLibForm();
  };

  const resetLibForm = () => { setIsLibEditing(false); setEditLibId(null); setLibTitle(''); setLibImage(''); setLibExtra(''); setLibPrice(''); setLibRating(5); };

  const toggleTodo = async (id: string, completed: boolean) => { await updateDoc(doc(db, "todos", id), { completed: !completed }); };
  const confirmDeleteTodo = async () => { if (deleteTodoId) await deleteDoc(doc(db, "todos", deleteTodoId)); setDeleteTodoModalOpen(false); };
  const saveEdit = async (id: string) => { await updateDoc(doc(db, "todos", id), { task: editText, startDate: editStartDate, dueDate: editDueDate }); setEditingId(null); };

  const flowers = ["🌱", "🌿", "🪴", "🎍", "🌸", "💐"];
  const growthScore = (todos.filter(t => t.completed).length * 2) + (journals.length * 5) + (booksRead.length * 10);
  const gardenLevel = Math.min(Math.floor(growthScore / 10), 5);

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card fade-section">
          <span style={{fontSize: '4rem'}}>🌻</span>
          <h1>Bamboo's Book</h1>
          <p>เข้าสู่ระบบเพื่อเริ่มบันทึกการเติบโตของคุณ</p>
          <button onClick={handleLogin} className="action-btn-main login-btn">Login with Google 🚀</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-layout sidebar-expanded ${isNight ? 'night-theme' : 'day-theme'} ${mobileSidebarOpen ? 'sidebar-toggle-visible' : ''}`}>
      <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-container">
          <div className="sidebar-header" style={{ marginBottom: '5px' }}>
            <div className="logo-section"><span className="logo-emoji">🌻</span><span className="brand-name">Bamboo's Book</span></div>
          </div>
          <nav className="nav-list-cozy" style={{ marginTop: '0', gap: '4px' }}>
            <div className={`nav-item-pill ${activeTab === 'todo' ? 'active' : ''}`} onClick={() => setActiveTab('todo')}><span className="icon">📝</span> <span className="nav-text">Missions</span></div>
            <div className={`nav-item-pill ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}><span className="icon">📖</span> <span className="nav-text">Journal</span></div>
            <div className={`nav-item-pill ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}><span className="icon">📚</span> <span className="nav-text">My Library</span></div>
          </nav>
          <div className="sidebar-footer-garden">
            <div className="sidebar-center">
              <div className="fortune-center">{dailyFortune}</div>
              <div className="music-player"><div className="player-wrapper"><iframe title="Cozy Track" className="player-iframe" src="https://www.youtube.com/embed/JdqL89ZZwFw" allowFullScreen /></div></div>
            </div>
            <div className="garden-status-pill">
              <span className="garden-icon">{flowers[gardenLevel]}</span>
              <div className="garden-meta"><span className="garden-lv">Garden Lv.{gardenLevel}</span><div className="xp-track"><div className="xp-bar" style={{ width: `${(growthScore % 10) * 10}%` }}></div></div></div>
            </div>
            <div className="logout-link-container"><span onClick={handleLogout} className="logout-text-link">ออกจากระบบ</span></div>
          </div>
        </div>
      </aside>

      <div className={`mobile-overlay ${mobileSidebarOpen ? 'visible' : ''}`} onClick={() => setMobileSidebarOpen(false)} />

      <main className="main-content">
        <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(v => !v)}>☰</button>
        <div className="cover-box"><img src="https://i.pinimg.com/originals/bd/3b/3f/bd3b3ff5565be74a9c8bba681dde7fdd.gif" className="cover-img" alt="cover" /></div>

        <div className="scroll-area">
          <div className="inner-content">
            {activeTab === 'todo' ? (
              <section className="fade-section">
                <header className="page-header"><div className="header-with-date"><div><h1>Missions</h1><p>มีอะไรต้องทำอีกเยอะเลย ลุกขึ้นมาทำได้แล้ว~ 💧</p></div><div className="today-date">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div></header>
                <div className="cozy-card">
                  <form onSubmit={handleTodoSubmit}>
                    <div className="input-row"><input type="text" className="full-input" placeholder="เพิ่มภารกิจใหม่..." value={todoInput} onChange={(e) => setTodoInput(e.target.value)} /><button type="submit" className="action-btn-main">เพิ่มภารกิจ</button></div>
                    <div className="date-row"><label className="date-label"><span>เริ่ม</span><input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label><label className="date-label"><span>เสร็จ</span><input type="date" className="date-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label></div>
                    <div className="pill-selector">{(['low', 'medium', 'high'] as const).map(p => (<button key={p} type="button" className={`pill-btn ${priority === p ? `active-${p}` : ''}`} onClick={() => setPriority(p)}>{p === 'low' ? 'ชิลล์ 🌸' : p === 'medium' ? 'ปกติ ✉️' : 'ด่วน 🔥'}</button>))}</div>
                  </form>
                </div>
                <div className="items-list">
                  {todos.map(t => (
                    <div key={t.id} className={`item-card border-${t.priority} ${t.completed ? 'done' : ''}`}><div className="item-left"><input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)} className="circle-check" /><div className="item-info"><span className="item-task">{t.task}</span>{t.dueDate && <span className={`item-dates ${!t.completed && isOverdue(t.dueDate) ? 'overdue-text' : ''}`}>⏰ {new Date(t.dueDate).toLocaleDateString('th-TH')}</span>}</div></div><button onClick={() => { setDeleteTodoId(t.id); setDeleteTodoModalOpen(true); }} className="icon-btn">🗑️</button></div>
                  ))}
                </div>
              </section>
            ) : activeTab === 'journal' ? (
              <section className="fade-section">
                <header className="page-header"><h1>Diary</h1></header>
                <div className="cozy-card">
                  <div className="pill-selector type-toggle"><button className={`pill-btn ${journalType === 'daily' ? 'active-diary' : ''}`} onClick={() => setJournalType('daily')}>บันทึกทั่วไป ✨</button><button className={`pill-btn ${journalType === 'letter' ? 'active-letter' : ''}`} onClick={() => setJournalType('letter')}>จดหมายถึงอนาคต 📮</button></div>
                  <div className="write-container"><div className="mood-strip">{['☀️', '☁️', '🌧️', '✨', '💤'].map(m => (<button key={m} className={`mood-item ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>))}{journalType === 'letter' && <input type="date" className="date-picker-soft" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />}<button onClick={addJournal} className="action-btn-save mood-save-btn">แชร์เรื่องน่ารักๆ 🫶</button></div><textarea className="text-area-cozy" placeholder="วันนี้มีเรื่องดีๆ เกิดขึ้นมั้ยย..." value={journalText} onChange={(e) => setJournalText(e.target.value)}></textarea></div>
                </div>
                <div className="journal-grid">{journals.map(j => (<div key={j.id} className="journal-card" onClick={() => { setSelectedJournal(j); setJournalModalOpen(true); }}><div className="card-top"><span className="mood">{j.mood}</span><span className="card-date">{j.createdAt?.toDate().toLocaleDateString('th-TH')}</span><span className="mail-icon-top">💌</span></div></div>))}</div>
              </section>
            ) : (
              /* --- MY LIBRARY PAGE --- */
              <section className="fade-section">
                <header className="page-header">
                  <h1>My Library {isLibEditing && <span style={{fontSize:'1rem', color:'var(--accent)'}}>(แก้ไข...)</span>}</h1>
                  <div className="pill-selector type-toggle">
                    <button className={`pill-btn ${librarySubTab === 'read' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('read'); resetLibForm(); }}>อ่านแล้ว ✨</button>
                    <button className={`pill-btn ${librarySubTab === 'tbr' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('tbr'); resetLibForm(); }}>กองดอง 📚</button>
                    <button className={`pill-btn ${librarySubTab === 'wish' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('wish'); resetLibForm(); }}>อยากอ่าน 📮</button>
                    <button className={`pill-btn ${librarySubTab === 'place' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('place'); resetLibForm(); }}>ที่อยากไป 📍</button>
                  </div>
                </header>

                {/* --- Bookshelf Visual Section --- */}
                <div className="library-visual-section">
                  <div className="shelf-display-container" style={{ backgroundImage: `url(${SHELF_BG})` }}>
                    <div className="shelf-grid-overlay">
                      {booksRead.map((book, index) => {
                        const booksPerRow = 9;
                        const row = Math.floor(index / booksPerRow);
                        const col = index % booksPerRow;
                        if (row > 4) return null;
                        return (
                          <img key={book.id} src={BOOK_SPINES[index % BOOK_SPINES.length]} className="book-on-shelf"
                            style={{ bottom: `${row * 19.5 + 4}%`, left: `${col * 8 + 10}%` }} title={book.title} />
                        );
                      })}
                    </div>
                  </div>
                  <div className="tbr-stack-visual">
                    {booksTBR.map((book, index) => (
                      <div key={book.id} className="tbr-stacked-book" style={{ bottom: `${index * 12}px`, zIndex: index }}>
                        <img src={TBR_BOOK_IMG} alt="TBR Book" />
                        <span className="tbr-tooltip">{book.title}</span>
                      </div>
                    ))}
                    {booksTBR.length > 0 && <div className="tbr-label">กองดอง ({booksTBR.length})</div>}
                  </div>
                </div>

                {/* --- Input Section --- */}
                <div className="cozy-card lib-form-container">
                  <div className="lib-form-flex" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div className="lib-image-preview-box" style={{ width: '120px', height: '160px', borderRadius: '12px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #ddd', flexShrink: 0 }}>
                      {libImage ? <img src={libImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>📸</span>}
                    </div>
                    <div className="lib-inputs-area" style={{ flex: 1 }}>
                      <div className="input-row">
                        <input type="text" className="full-input" placeholder={librarySubTab === 'place' ? "ชื่อสถานที่..." : "ชื่อหนังสือ..."} value={libTitle} onChange={(e) => setLibTitle(e.target.value)} />
                        <input type="text" className="full-input" placeholder="URL รูปภาพ..." value={libImage} onChange={(e) => setLibImage(e.target.value)} />
                      </div>
                      {librarySubTab === 'read' && (
                        <>
                          <div className="rating-input" style={{ marginBottom: '10px' }}>
                            <span style={{ marginRight: '10px' }}>คะแนน:</span>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} onClick={() => setLibRating(s)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>{s <= libRating ? '⭐' : '☆'}</span>
                            ))}
                          </div>
                          <textarea className="text-area-cozy" style={{ height: '60px' }} placeholder="เขียนรีวิวสั้นๆ..." value={libExtra} onChange={(e) => setLibExtra(e.target.value)} />
                        </>
                      )}
                      {librarySubTab === 'tbr' && <input type="text" className="full-input" placeholder="โน้ตสั้นๆ..." value={libExtra} onChange={(e) => setLibExtra(e.target.value)} />}
                      {librarySubTab === 'wish' && <div className="input-row"><input type="number" className="full-input" placeholder="ราคา..." value={libPrice} onChange={(e) => setLibPrice(e.target.value)} /><input type="text" className="full-input" placeholder="เหตุผล..." value={libExtra} onChange={(e) => setLibExtra(e.target.value)} /></div>}
                      {librarySubTab === 'place' && <input type="text" className="full-input" placeholder="พิกัด / เหตุผล..." value={libExtra} onChange={(e) => setLibExtra(e.target.value)} />}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                        {isLibEditing ? (
                          <><button onClick={saveEditLib} className="action-btn-main">บันทึกแก้ไข ✨</button><button onClick={resetLibForm} className="action-btn-main" style={{ background: '#ccc' }}>ยกเลิก</button></>
                        ) : (
                          <button onClick={addLibraryItem} className="action-btn-main">บันทึกลงคลัง 📚</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- List Section --- */}
                <div className="library-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', padding: '20px 0' }}>
                  {librarySubTab === 'read' && booksRead.map(b => (
                    <div key={b.id} className="lib-mini-card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #D2DCB6' }}>
                      <div style={{ aspectRatio: '3/4', background: '#f9f9f9' }}>{b.image ? <img src={b.image} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>📸</div>}</div>
                      <div style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>{b.title}</b><div style={{ display: 'flex', gap: '4px', fontSize: '0.65rem', opacity: 0.5 }}><span onClick={() => startEditLib(b)}>✏️</span><span onClick={() => deleteLibItem('booksRead', b.id)}>🗑️</span></div></div>
                        <div style={{ fontSize: '0.6rem' }}>{"⭐".repeat(b.rating)}</div>
                      </div>
                    </div>
                  ))}
                  {librarySubTab === 'tbr' && booksTBR.map(b => (
                    <div key={b.id} className="lib-mini-card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #D2DCB6' }}>
                      <div style={{ aspectRatio: '3/4', background: '#f9f9f9' }}>{b.image ? <img src={b.image} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>📸</div>}</div>
                      <div style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>{b.title}</b><div style={{ display: 'flex', gap: '4px', fontSize: '0.65rem', opacity: 0.5 }}><span onClick={() => startEditLib(b)}>✏️</span><span onClick={() => deleteLibItem('booksTBR', b.id)}>🗑️</span></div></div>
                        <p style={{ fontSize: '0.6rem', color: '#888', margin: '4px 0' }}>{b.note}</p>
                      </div>
                    </div>
                  ))}
                  {librarySubTab === 'wish' && booksWish.map(b => (
                    <div key={b.id} className="lib-mini-card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #D2DCB6' }}>
                      <div style={{ aspectRatio: '3/4', background: '#f9f9f9' }}>{b.image ? <img src={b.image} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>📸</div>}</div>
                      <div style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>{b.title}</b><div style={{ display: 'flex', gap: '4px', fontSize: '0.65rem', opacity: 0.5 }}><span onClick={() => startEditLib(b)}>✏️</span><span onClick={() => deleteLibItem('booksWish', b.id)}>🗑️</span></div></div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--accent)' }}>{b.price}.-</p>
                      </div>
                    </div>
                  ))}
                  {librarySubTab === 'place' && places.map(p => (
                    <div key={p.id} className="lib-mini-card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #D2DCB6' }}>
                      <div style={{ aspectRatio: '16/9', background: '#f9f9f9' }}>{p.image ? <img src={p.image} alt="place" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>📸</div>}</div>
                      <div style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>{p.name}</b><div style={{ display: 'flex', gap: '4px', fontSize: '0.65rem', opacity: 0.5 }}><span onClick={() => startEditLib(p)}>✏️</span><span onClick={() => deleteLibItem('readingPlaces', p.id)}>🗑️</span></div></div>
                        <p style={{ fontSize: '0.65rem', color: '#888' }}>📍 {p.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* --- Modals --- */}
        {journalModalOpen && selectedJournal && (
          <div className="modal-overlay" onClick={() => setJournalModalOpen(false)}>
            <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="note-card">
                <div className="note-content">{selectedJournal.content}</div>
                <div className="note-date">{selectedJournal.createdAt?.toDate().toLocaleDateString('th-TH')}</div>
                <button className="action-btn-main" style={{marginTop:'15px'}} onClick={() => setJournalModalOpen(false)}>ปิด</button>
              </div>
            </div>
          </div>
        )}

        {deleteTodoModalOpen && (
          <div className="modal-overlay" onClick={() => setDeleteTodoModalOpen(false)}>
            <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="note-card">
                <div className="note-content">ลบรายการนี้ใช่ไหม?</div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
                  <button className="cancel-btn icon-btn" style={{background:'#ccc'}} onClick={() => setDeleteTodoModalOpen(false)}>ยกเลิก</button>
                  <button className="action-btn-main" onClick={confirmDeleteTodo}>ลบ</button>
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