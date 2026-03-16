import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // ปรับ path ตามจริง
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, Timestamp, where } from "firebase/firestore";
import { User } from "firebase/auth";
import { DeleteModal } from '../components/Modal';

interface Props {
  user: User;
  setCurrentAmbience: (id: string) => void;
}

const MissionList: React.FC<Props> = ({ user, setCurrentAmbience }) => {
  const [todos, setTodos] = useState<any[]>([]);
  const [todoInput, setTodoInput] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubTodos = onSnapshot(
      query(collection(db, "todos"), where("uid", "==", user.uid), orderBy("createdAt", "desc")),
      (snap) => {
        setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsubTodos();
  }, [user]);

  const handleTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim() || !user) return;
    await addDoc(collection(db, "todos"), { task: todoInput, completed: false, priority, startDate, dueDate, createdAt: Timestamp.now(), uid: user.uid });
    setTodoInput(''); setStartDate(''); setDueDate('');
  };

  const toggleTodo = async (id: string, completed: boolean) => await updateDoc(doc(db, "todos", id), { completed: !completed });

  const triggerDelete = (id: string) => {
    setDeleteTarget(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteDoc(doc(db, "todos", deleteTarget));
      setDeleteModalOpen(false); setDeleteTarget(null);
    }
  };

  return (
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
            <button onClick={() => triggerDelete(t.id)} className="icon-btn">🗑️</button>
          </div>
        ))}
      </div>
      <DeleteModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} />
    </section>
  );
};

export default MissionList;