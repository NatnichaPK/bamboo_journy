import React, { useState, useEffect } from 'react';
import './App.css';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import {
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, Timestamp
} from "firebase/firestore";

interface Todo { id: string; task: string; completed: boolean; priority: 'high' | 'medium' | 'low'; startDate?: string; dueDate?: string; createdAt: any; uid?: string; }
interface Journal { id: string; content: string; mood: string; type: 'daily' | 'letter'; unlockDate?: string; createdAt: any; uid?: string; }

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'todo' | 'journal'>('todo');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);

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
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo));
      setTodos(all.filter(t => t.uid === user.uid || !t.uid));
    });

    const qJournals = query(collection(db, "journals"), orderBy("createdAt", "desc"));
    const unsubJournals = onSnapshot(qJournals, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Journal));
      setJournals(all.filter(j => j.uid === user.uid || !j.uid));
    });
    return () => { unsubTodos(); unsubJournals(); };
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

  const toggleTodo = async (id: string, completed: boolean) => { await updateDoc(doc(db, "todos", id), { completed: !completed }); };
  const confirmDeleteTodo = async () => { if (deleteTodoId) await deleteDoc(doc(db, "todos", deleteTodoId)); setDeleteTodoModalOpen(false); };
  const saveEdit = async (id: string) => { await updateDoc(doc(db, "todos", id), { task: editText, startDate: editStartDate, dueDate: editDueDate }); setEditingId(null); };

  const flowers = ["🌱", "🌿", "🪴", "🎍", "🌸", "💐"];
  const growthScore = (todos.filter(t => t.completed).length * 2) + (journals.length * 5);
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
          <div className="sidebar-header">
            <div className="logo-section"><span className="logo-emoji">🌻</span><span className="brand-name">Bamboo's Book</span></div>
          </div>
          
          <nav className="nav-list-cozy">
            <div className={`nav-item-pill ${activeTab === 'todo' ? 'active' : ''}`} onClick={() => setActiveTab('todo')}>
              <span className="icon">📝</span> <span className="nav-text">Missions</span>
            </div>
            <div className={`nav-item-pill ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>
              <span className="icon">📖</span> <span className="nav-text">Journal</span>
            </div>
          </nav>
          
          <div className="sidebar-footer-garden">
            <div className="sidebar-center">
              <div className="fortune-center">{dailyFortune}</div>
              <div className="music-player">
                <div className="player-wrapper"><iframe title="Cozy Track" className="player-iframe" src="https://www.youtube.com/embed/JdqL89ZZwFw" allowFullScreen /></div>
              </div>
            </div>
            <div className="garden-status-pill">
              <span className="garden-icon">{flowers[gardenLevel]}</span>
              <div className="garden-meta">
                <span className="garden-lv">Garden Lv.{gardenLevel}</span>
                <div className="xp-track"><div className="xp-bar" style={{ width: `${(growthScore % 10) * 10}%` }}></div></div>
              </div>
            </div>
            {/* Logout Link Minimal */}
            <div className="logout-link-container">
              <span onClick={handleLogout} className="logout-text-link">ออกจากระบบ</span>
            </div>
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
                <header className="page-header">
                  <div className="header-with-date">
                    <div><h1>Missions</h1><p>มีอะไรต้องทำอีกเยอะเลย ลุกขึ้นมาทำได้แล้ว~ 💧</p></div>
                    <div className="today-date">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  </div>
                </header>
                <div className="cozy-card">
                  <form onSubmit={handleTodoSubmit}>
                    <div className="input-row">
                      <input type="text" className="full-input" placeholder="เพิ่มภารกิจใหม่..." value={todoInput} onChange={(e) => setTodoInput(e.target.value)} />
                      <button type="submit" className="action-btn-main">เพิ่มภารกิจ</button>
                    </div>
                    <div className="date-row">
                      <label className="date-label"><span className="date-label-text">ต้องเริ่มทำ</span><input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
                      <label className="date-label"><span className="date-label-text">ต้องเสร็จ</span><input type="date" className="date-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
                    </div>
                    <div className="pill-selector">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button key={p} type="button" className={`pill-btn ${priority === p ? `active-${p}` : ''}`} onClick={() => setPriority(p)}>
                          {p === 'low' ? 'ชิลล์ 🌸' : p === 'medium' ? 'ปกติ ✉️' : 'ด่วน 🔥'}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
                <div className="items-list">
                  {todos.map(t => (
                    <div key={t.id} className={`item-card border-${t.priority} ${t.completed ? 'done' : ''} ${editingId === t.id ? 'editing' : ''}`}>
                      <div className="item-left">
                        <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, t.completed)} className="circle-check" />
                        <div className="item-info">
                          {editingId === t.id ? (
                            <div className="edit-mode">
                              <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="edit-input" />
                              <div className="edit-dates">
                                <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="date-input-small" />
                                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="date-input-small" />
                              </div>
                            </div>
                          ) : (
                            <div className="item-task-with-dates">
                              <span className="item-task">{t.task}</span>
                              {(t.startDate || t.dueDate) && (
                                <span className={`item-dates ${!t.completed && isOverdue(t.dueDate) ? 'overdue-text' : ''}`}>
                                  {t.startDate && `🏁 ${new Date(t.startDate).toLocaleDateString('th-TH')}`}
                                  {t.dueDate && ` ⏰ ${new Date(t.dueDate).toLocaleDateString('th-TH')}`}
                                  {!t.completed && isOverdue(t.dueDate) && " (เลยกำหนด! 🚨)"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="item-actions">
                        {editingId === t.id ? (
                          <><button onClick={() => saveEdit(t.id)} className="icon-btn">💾</button><button onClick={() => setEditingId(null)} className="icon-btn">✕</button></>
                        ) : (
                          <><button onClick={() => {setEditingId(t.id); setEditText(t.task); setEditStartDate(t.startDate||''); setEditDueDate(t.dueDate||'');}} className="icon-btn">✏️</button>
                          <button onClick={() => { setDeleteTodoId(t.id); setDeleteTodoModalOpen(true); }} className="icon-btn">🗑️</button></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="fade-section">
                <header className="page-header"><h1>Diary</h1></header>
                <div className="cozy-card">
                  <div className="pill-selector type-toggle">
                    <button className={`pill-btn ${journalType === 'daily' ? 'active-diary' : ''}`} onClick={() => setJournalType('daily')}>บันทึกทั่วไป ✨</button>
                    <button className={`pill-btn ${journalType === 'letter' ? 'active-letter' : ''}`} onClick={() => setJournalType('letter')}>จดหมายถึงอนาคต 📮</button>
                  </div>
                  <div className="write-container">
                    <div className="mood-strip">
                      {['☀️', '☁️', '🌧️', '✨', '💤'].map(m => (
                        <button key={m} className={`mood-item ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>
                      ))}
                      {journalType === 'letter' && <input type="date" className="date-picker-soft" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />}
                      <button onClick={addJournal} className="action-btn-save mood-save-btn">แชร์เรื่องน่ารักๆ 🫶</button>
                    </div>
                    <textarea className="text-area-cozy" placeholder="วันนี้มีเรื่องดีๆ เกิดขึ้นมั้ยย..." value={journalText} onChange={(e) => setJournalText(e.target.value)}></textarea>
                  </div>
                </div>
                <div className="journal-grid">
                  {journals.map(j => {
                    const isLocked = j.type === 'letter' && new Date(j.unlockDate!) > new Date();
                    return (
                      <div key={j.id} className={`journal-card ${isLocked ? 'locked' : ''}`}>
                        <div className="card-top">
                          <div className="card-left">
                            <span className="mood">{isLocked ? '🔒' : j.mood}</span>
                            <span className="card-date">{j.createdAt?.toDate().toLocaleDateString('th-TH')}</span>
                          </div>
                          <button className="mail-icon-top" onClick={() => {
                            setSelectedJournal(j);
                            setJournalModalOpen(true);
                          }}>💌</button>
                        </div>
                        <div className="card-body-wrapper"></div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        {journalModalOpen && selectedJournal && (
          <div className="modal-overlay" onClick={() => setJournalModalOpen(false)}>
            <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setJournalModalOpen(false)}>✕</button>
              <div className="note-card">
                <div className="note-emoji">💌</div>
                <div className="note-content">{selectedJournal.type === 'letter' && new Date(selectedJournal.unlockDate!) > new Date() ? `จะเปิดอ่านในวันที่ ${new Date(selectedJournal.unlockDate!).toLocaleDateString('th-TH')}` : selectedJournal.content}</div>
                <div className="note-date">{selectedJournal.createdAt?.toDate().toLocaleDateString('th-TH')}</div>
              </div>
            </div>
          </div>
        )}

        {deleteTodoModalOpen && (
          <div className="modal-overlay" onClick={() => setDeleteTodoModalOpen(false)}>
            <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="note-card">
                <div className="note-content">ยืนยันลบภารกิจนี้หรือไม่?</div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
                  <button className="cancel-btn icon-btn" onClick={() => setDeleteTodoModalOpen(false)}>ยกเลิก</button>
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