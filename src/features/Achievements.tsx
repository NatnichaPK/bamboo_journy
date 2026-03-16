import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { User } from "firebase/auth";

interface Props {
  user: User;
}

const Achievements: React.FC<Props> = ({ user }) => {
  const [todos, setTodos] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [booksRead, setBooksRead] = useState<any[]>([]);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  useEffect(() => {
    if (!user) return;

    // ✅ แก้ไข: เพิ่ม where("uid", "==", user.uid) ทุกอัน เพื่อให้ผ่าน Security Rules
    
    // 1. Fetch Todos
    const unsubTodos = onSnapshot(
      query(collection(db, "todos"), where("uid", "==", user.uid)), 
      (snap) => {
        setTodos(snap.docs.map(d => ({ ...d.data() })));
      }
    );

    // 2. Fetch Journals
    const unsubJournals = onSnapshot(
      query(collection(db, "journals"), where("uid", "==", user.uid)), 
      (snap) => {
        setJournals(snap.docs.map(d => ({ ...d.data() })));
      }
    );

    // 3. Fetch BooksRead
    const unsubRead = onSnapshot(
      query(collection(db, "booksRead"), where("uid", "==", user.uid)), 
      (snap) => {
        setBooksRead(snap.docs.map(d => ({ ...d.data() })));
      }
    );

    return () => { unsubTodos(); unsubJournals(); unsubRead(); };
  }, [user]);

  const growthScore = (todos.filter(t => t.completed).length * 2) + (journals.length * 5) + (booksRead.length * 10);
  const gardenLevel = Math.min(Math.floor((growthScore % 50) / 10), 5);
  const gardenMasterCount = Math.floor(growthScore / 50);
  const bookBadgeCount = Math.floor(booksRead.length / 5);
  const journalBadgeCount = Math.floor(journals.length / 7);
  const achieverBadgeCount = Math.floor(todos.filter(t => t.completed && t.priority === 'high').length / 3);

  return (
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
  );
};

export default Achievements;