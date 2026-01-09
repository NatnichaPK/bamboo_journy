import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { LibraryModal, DeleteModal } from '../components/Modal';

// --- Assets ---
const SHELF_BG = "https://img5.pic.in.th/file/secure-sv1/Bookshelf-background.jpg";
const BOOK_SPINES = [
  "https://img2.pic.in.th/58a588a2438d7574f.png", "https://img2.pic.in.th/6472edacb5cc20989.png",
  "https://img2.pic.in.th/10842f07c6c278370f.png", "https://img2.pic.in.th/118768cdd157fa09b0.png",
  "https://img2.pic.in.th/130f04f256e973ca64.png", "https://img2.pic.in.th/1c785628ac2e6e596.png",
  "https://img2.pic.in.th/34a266bc929fd8425.png"
];

interface Props {
  user: User;
}

const Library: React.FC<Props> = ({ user }) => {
  const [booksRead, setBooksRead] = useState<any[]>([]);
  const [booksWish, setBooksWish] = useState<any[]>([]);
  const [booksTBR, setBooksTBR] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  
  const [librarySubTab, setLibrarySubTab] = useState<'read' | 'tbr' | 'wish' | 'place'>('read');
  const [libTitle, setLibTitle] = useState('');
  const [libImage, setLibImage] = useState('');
  const [libExtra, setLibExtra] = useState('');
  const [libPrice, setLibPrice] = useState('');
  const [libRating, setLibRating] = useState(5);
  const [isLibEditing, setIsLibEditing] = useState(false);
  const [editLibId, setEditLibId] = useState<string | null>(null);
  const [selectedLibItem, setSelectedLibItem] = useState<any>(null);
  const [libModalOpen, setLibModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  
  const libraryFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsubRead = onSnapshot(query(collection(db, "booksRead"), orderBy("createdAt", "desc")), (snap) => {
      setBooksRead(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((b: any) => b.uid === user.uid));
    });
    const unsubWish = onSnapshot(query(collection(db, "booksWish"), orderBy("createdAt", "desc")), (snap) => {
      setBooksWish(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((b: any) => b.uid === user.uid));
    });
    const unsubTBR = onSnapshot(query(collection(db, "booksTBR"), orderBy("createdAt", "desc")), (snap) => {
      setBooksTBR(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((b: any) => b.uid === user.uid));
    });
    const unsubPlaces = onSnapshot(query(collection(db, "readingPlaces"), orderBy("createdAt", "desc")), (snap) => {
      setPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((p: any) => p.uid === user.uid));
    });
    return () => { unsubRead(); unsubWish(); unsubTBR(); unsubPlaces(); };
  }, [user]);

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

  return (
    <section className="fade-section">
      <header className="page-header"><h1>My Library</h1>
        <div className="pill-selector type-toggle">
          <button className={`pill-btn ${librarySubTab === 'read' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('read'); resetLibForm(); }}>อ่านแล้ว ✨</button>
          <button className={`pill-btn ${librarySubTab === 'tbr' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('tbr'); resetLibForm(); }}>กองดอง 📚</button>
          <button className={`pill-btn ${librarySubTab === 'wish' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('wish'); resetLibForm(); }}>อยากอ่าน 📮</button>
          <button className={`pill-btn ${librarySubTab === 'place' ? 'active-library-sub' : ''}`} onClick={() => { setLibrarySubTab('place'); resetLibForm(); }}>อยากไปนั่งอ่าน 📍</button>
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
              {librarySubTab === 'read' && <div>Rating: {[1, 2, 3, 4, 5].map(s => <span key={s} onClick={() => setLibRating(s)} style={{ cursor: 'pointer', color: s <= libRating ? 'gold' : '#ccc' }}>⭐</span>)}</div>}
              <textarea className="text-area-cozy" placeholder="Dump Text..." value={libExtra} onChange={(e) => setLibExtra(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={isLibEditing ? saveEditLib : addLibraryItem} className="action-btn-main">{isLibEditing ? 'บันทึกแก้ไข' : 'เพิ่มลงคลัง'}</button>
                {isLibEditing && <button onClick={resetLibForm} className="action-btn-main" style={{ background: '#ccc' }}>ยกเลิก</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="library-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {(librarySubTab === 'read' ? booksRead : librarySubTab === 'tbr' ? booksTBR : librarySubTab === 'wish' ? booksWish : places).map((item: any) => (
          <div key={item.id} className="lib-mini-card" onClick={() => { setSelectedLibItem(item); setLibModalOpen(true); }}>
            <div style={{ aspectRatio: '3/4', background: '#f5f5f5' }}>{item.image && <img src={item.image} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
            <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <b style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{item.title || item.name}</b>
              <div style={{ display: 'flex', gap: '5px' }}><span onClick={(e) => startEditLib(item, e)}>✏️</span><span onClick={(e) => triggerDelete(librarySubTab === 'read' ? 'booksRead' : 'booksTBR', item.id, e)}>🗑️</span></div>
            </div>
          </div>
        ))}
      </div>
      <LibraryModal isOpen={libModalOpen} onClose={() => setLibModalOpen(false)} data={selectedLibItem} />
      <DeleteModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} />
    </section>
  );
};

export default Library;