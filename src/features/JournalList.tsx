import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, Timestamp, where } from "firebase/firestore";
import { User } from "firebase/auth";
import { JournalModal } from '../components/Modal';

interface Props {
  user: User;
}

const JournalList: React.FC<Props> = ({ user }) => {
  const [journals, setJournals] = useState<any[]>([]);
  const [journalText, setJournalText] = useState('');
  const [journalType, setJournalType] = useState<'daily' | 'letter'>('daily');
  const [mood, setMood] = useState('☀️');
  const [unlockDate, setUnlockDate] = useState('');
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const unsubJournals = onSnapshot(
      query(collection(db, "journals"), where("uid", "==", user.uid), orderBy("createdAt", "desc")),
      (snap) => {
        setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsubJournals();
  }, [user]);

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

  return (
    <section className="fade-section">
      <header className="page-header"><h1>Diary</h1></header>
      <div className="cozy-card">
        <div className="pill-selector type-toggle">
          <button className={`pill-btn ${journalType === 'daily' ? 'active-diary' : ''}`} onClick={() => setJournalType('daily')}>บันทึกทั่วไป ✨</button>
          <button className={`pill-btn ${journalType === 'letter' ? 'active-letter' : ''}`} onClick={() => setJournalType('letter')}>จดหมายถึงอนาคต 📮</button>
        </div>
        <div className="mood-strip">
          {['☀️', '🌧️', '✨', '💤', '🎧', '😎', '🌻', '🤣'].map(m => (<button key={m} className={`mood-item ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>))}
          {journalType === 'letter' && <input type="date" className="date-picker-soft" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />}
          <button onClick={addJournal} className="action-btn-save mood-save-btn">บันทึกเรื่องราวดีๆ 🫶</button>
        </div>
        <textarea className="text-area-cozy" placeholder="เล่าเรื่องวันนี้ให้ฟังหน่อย..." value={journalText} onChange={(e) => setJournalText(e.target.value)}></textarea>
      </div>
      <div className="journal-grid">
        {journals.map((j) => {
          const isReady = j.type === 'letter' && j.unlockDate && new Date(j.unlockDate).getTime() <= new Date().setHours(0, 0, 0, 0) && !j.opened;
          const isLocked = j.type === 'letter' && j.unlockDate && new Date(j.unlockDate).getTime() > new Date().setHours(0, 0, 0, 0);

          return (
            <div key={j.id} className={`journal-card ${isReady ? 'ready-to-open' : ''}`}
              onClick={() => {
                if (isLocked) {
                  return alert(`เปิดวันที่ ${new Date(j.unlockDate!).toLocaleDateString('th-TH')}`);
                }
                markAsOpened(j);
                setSelectedJournal(j);
                setJournalModalOpen(true);
              }}
              style={{ position: 'relative', overflow: 'visible' }}>
              <div className="card-top">
                <div style={{ position: 'absolute', top: '5px', right: '5px' }}>{isReady && <span>✨</span>}{j.opened && <span style={{ color: '#FFD700' }}>⭐</span>}</div>
                <span style={{ fontSize: '3.5rem' }}>{isLocked ? '🔒' : '💌'}</span>
                <div className="mood-date-row"><span>{j.mood}</span><span className="card-date">{j.createdAt?.toDate().toLocaleDateString('th-TH')}</span></div>
              </div>
            </div>
          );
        })}
      </div>
      <JournalModal isOpen={journalModalOpen} onClose={() => setJournalModalOpen(false)} data={selectedJournal} />
    </section>
  );
};

export default JournalList;