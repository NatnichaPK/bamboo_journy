import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
import { 
  collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, Timestamp 
} from "firebase/firestore";

interface Todo { id: string; task: string; completed: boolean; priority: 'high' | 'medium' | 'low'; startDate?: string; dueDate?: string; createdAt: any; }
interface Journal { id: string; content: string; mood: string; type: 'daily' | 'letter'; unlockDate?: string; createdAt: any; }

function App() {
  const [activeTab, setActiveTab] = useState<'todo' | 'journal'>('todo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [fortune, setFortune] = useState('');
  
  const [todoInput, setTodoInput] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [mood, setMood] = useState('☀️');
  const [journalText, setJournalText] = useState('');
  const [journalType, setJournalType] = useState<'daily' | 'letter'>('daily');
  const [unlockDate, setUnlockDate] = useState('');
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    // กลางวัน 6 AM - 5 PM, กลางคืน 5 PM - 6 AM
    setIsNight(hour >= 17 || hour < 6);

    const unsubTodos = onSnapshot(query(collection(db, "todos"), orderBy("createdAt", "desc")), (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo)));
    });
    const unsubJournals = onSnapshot(query(collection(db, "journals"), orderBy("createdAt", "desc")), (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Journal)));
    });
    return () => { unsubTodos(); unsubJournals(); };
  }, []);

  const toggleTodo = async (id: string, completed: boolean) => {
    await updateDoc(doc(db, "todos", id), { completed: !completed });
  };

  const handleTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim()) return;
    await addDoc(collection(db, "todos"), {
      task: todoInput, completed: false, priority: priority, startDate, dueDate, createdAt: Timestamp.now()
    });
    setTodoInput('');
    setPriority('medium');
    setStartDate('');
    setDueDate('');
  };

  const addJournal = async () => {
    if (!journalText.trim()) return;
    await addDoc(collection(db, "journals"), {
      content: journalText, mood, type: journalType,
      unlockDate: journalType === 'letter' ? unlockDate : null,
      createdAt: Timestamp.now()
    });
    setJournalText('');
    setUnlockDate('');
    alert("บันทึกเรียบร้อยแล้ว ✨");
  };

  const flowers = ["🌱", "🌿", "🪴", "🎍", "🌸", "💐"];
  const completedTodosCount = todos.filter(t => t.completed).length;
  const growthScore = (completedTodosCount * 2) + (journals.length * 5);
  const gardenLevel = Math.min(Math.floor(growthScore / 10), 5);
  const xpPercentage = (growthScore % 10) * 10;

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'} ${isNight ? 'night-theme' : 'day-theme'} ${mobileSidebarOpen ? 'sidebar-toggle-visible' : ''}`}>
      
      <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="sidebar-float-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div className={`chevron ${isSidebarOpen ? 'left' : 'right'}`}></div>
        </button>

        <div className="sidebar-container">
          <div className="sidebar-header">
            <div className="logo-section" onClick={() => {
                const msgs = ["วันนี้จะมีเรื่องดีๆ นะ", "พักจิบชาบ้างนะ", "ท้องฟ้าสวยจัง", "ยิ้มหน่อยนะ 😊", "ขอให้วันนี้เป็นวันที่ดี!"];
                setFortune(msgs[Math.floor(Math.random()*msgs.length)]);
                setTimeout(() => setFortune(''), 3000);
            }}>
              <span className="logo-emoji">🌻</span>
              {isSidebarOpen && <span className="brand-name">Bamboo's Book</span>}
              {fortune && <div className="fortune-bubble">{fortune}</div>}
            </div>
          </div>

          <nav className="nav-list-cozy">
            <div className={`nav-item-pill ${activeTab === 'todo' ? 'active' : ''}`} onClick={() => setActiveTab('todo')}>
              <span className="icon">📝</span> {isSidebarOpen && <span className="nav-text">Missions</span>}
            </div>
            <div className={`nav-item-pill ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>
              <span className="icon">📖</span> {isSidebarOpen && <span className="nav-text">Journal</span>}
            </div>
          </nav>

          <div className="sidebar-footer-garden">
            {/* Sidebar center moved here to sit close to garden */}
            <div className="sidebar-center">
              <div className="fortune-center">{fortune || "วันนี้ต้องมีเรื่องดีๆ เกิดขึ้นแน่นอน 🌻"}</div>

              <div className="music-player">
                <div className="player-wrapper">
                  <iframe
                    title="Cozy Track"
                    className="player-iframe"
                    src="https://www.youtube.com/embed/dQQtFE62rRQ?autoplay=1&mute=1&controls=1"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
                    allowFullScreen
                  />
                </div>
                <div className="track-info">
                  <div className="track-title">Cozy Fireplace</div>
                  <div className="track-status">LIVE • playing</div>
                </div>
              </div>
            </div>

            <div className="garden-status-pill">
              <span className="garden-icon">{flowers[gardenLevel]}</span>
              {isSidebarOpen && (
                <div className="garden-meta">
                  <span className="garden-lv">Garden Lv.{gardenLevel}</span>
                  <div className="xp-track"><div className="xp-bar" style={{width: `${xpPercentage}%`}}></div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay: click to close sidebar on small screens */}
      <div className={`mobile-overlay ${mobileSidebarOpen ? 'visible' : ''}`} onClick={() => setMobileSidebarOpen(false)} />

      <main className="main-content">
        {/* Mobile menu button (visible on small screens) */}
        <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(v => !v)} aria-label="Toggle sidebar">☰</button>
        <div className="cover-box">
          <img src="https://i.pinimg.com/originals/bd/3b/3f/bd3b3ff5565be74a9c8bba681dde7fdd.gif" className="cover-img" alt="cover" />
        </div>

        <div className="scroll-area">
          <div className="inner-content">
            {activeTab === 'todo' ? (
              <section className="fade-section">
                <header className="page-header">
                  <div className="header-with-date">
                    <div>
                      <h1>Missions</h1>
                      <p>มีอะไรต้องทำอีกเยอะเลย ลุกขึ้นมาทำได้แล้ว~ 💧</p>
                    </div>
                    <div className="today-date">{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </header>
                
                <div className="cozy-card">
                  <form onSubmit={handleTodoSubmit}>
                    <div className="input-row">
                      <input type="text" className="full-input" placeholder="เพิ่มภารกิจใหม่..." value={todoInput} onChange={(e)=>setTodoInput(e.target.value)} />
                      <button type="submit" className="action-btn-main">เพิ่มภารกิจ</button>
                    </div>
                    <div className="date-row">
                      <label className="date-label">
                        <span className="date-label-text">ต้องเริ่มทำ</span>
                        <input type="date" className="date-input" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                      </label>
                      <label className="date-label">
                        <span className="date-label-text">ต้องเสร็จ</span>
                        <input type="date" className="date-input" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
                      </label>
                    </div>
                    <div className="button-row">
                      <div className="pill-selector">
                        <button type="button" className={`pill-btn ${priority === 'low' ? 'active-low' : ''}`} onClick={() => setPriority('low')}>ชิลล์ 🌸</button>
                        <button type="button" className={`pill-btn ${priority === 'medium' ? 'active-medium' : ''}`} onClick={() => setPriority('medium')}>ปกติ ✉️</button>
                        <button type="button" className={`pill-btn ${priority === 'high' ? 'active-high' : ''}`} onClick={() => setPriority('high')}>ด่วน 🔥</button>
                      </div>
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
                          {(t.startDate || t.dueDate) && <span className="item-dates">{t.startDate && `🏁 ${new Date(t.startDate).toLocaleDateString('th-TH')}`}{t.startDate && t.dueDate && ' → '}{t.dueDate && `⏰ ${new Date(t.dueDate).toLocaleDateString('th-TH')}`}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteDoc(doc(db, "todos", t.id))} className="del-btn-pill">ลบ</button>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="fade-section">
                <header className="page-header"><h1>Diary</h1></header>
                <div className="cozy-card">
                  {/* แก้ไขส่วนเลือกประเภทบันทึก */}
                  <div className="pill-selector type-toggle">
                    <button className={`pill-btn ${journalType === 'daily' ? 'active-diary' : ''}`} onClick={() => setJournalType('daily')}>บันทึกทั่วไป ✨</button>
                    <button className={`pill-btn ${journalType === 'letter' ? 'active-letter' : ''}`} onClick={() => setJournalType('letter')}>จดหมายถึงอนาคต 📮</button>
                  </div>

                  <div className="write-container">
                    <div className="mood-strip">
                      {['☀️', '☁️', '🌧️', '✨', '💤'].map(m => (
                        <button key={m} className={`mood-item ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>
                      ))}
                      {journalType === 'letter' && <input type="date" className="date-picker-soft" value={unlockDate} onChange={(e)=>setUnlockDate(e.target.value)} />}
                      <button onClick={addJournal} className="action-btn-save mood-save-btn">แชร์เรื่องน่ารักๆ 🫶</button>
                    </div>
                    <textarea className="text-area-cozy" placeholder="วันนี้มีเรื่องดีๆ เกิดขึ้นมั้ยย..." value={journalText} onChange={(e)=>setJournalText(e.target.value)}></textarea>
                  </div>
                </div>
                <div className="items-list">
                  {journals.map(j => {
                    const isLocked = j.type === 'letter' && new Date(j.unlockDate!) > new Date();
                    return (
                      <div key={j.id} className={`journal-card ${isLocked ? 'locked' : ''}`}>
                        <div className="card-top"><span>{isLocked ? '🔒' : j.mood}</span><span>{j.createdAt?.toDate().toLocaleDateString('th-TH')}</span></div>
                        <p className="card-body">{isLocked ? `จะเปิดอ่านในวันที่ ${new Date(j.unlockDate!).toLocaleDateString('th-TH')}` : j.content}</p>
                        {!isLocked && <button onClick={() => deleteDoc(doc(db, "journals", j.id))} className="del-btn-pill">ลบ</button>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;