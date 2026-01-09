import React from 'react';

// --- Journal Modal ---
export const JournalModal = ({ isOpen, onClose, data }: any) => {
  if (!isOpen || !data) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="journal-modal" onClick={e => e.stopPropagation()}>
        <div className="note-card">
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{data.mood}</div>
          <div className="note-content" style={{ whiteSpace: 'pre-wrap', color: 'inherit', textAlign: 'left' }}>
            {data.content}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="action-btn-main" style={{ flex: 1 }} onClick={onClose}>
              ปิดหน้าต่างนี้ 🌿
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Library Modal ---
export const LibraryModal = ({ isOpen, onClose, data }: any) => {
  if (!isOpen || !data) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="journal-modal" onClick={e => e.stopPropagation()}>
        <div className="note-card" style={{ padding: 0, width: '400px', overflow: 'hidden' }}>
          <div style={{ height: '220px', background: '#f5f5f5' }}>
            {data.image && <img src={data.image} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ padding: '20px' }}>
            <h2>{data.title || data.name}</h2>
            <p style={{ color: 'inherit' }}>{data.review || data.note || data.reason || data.location}</p>
            <button className="action-btn-main" style={{ width: '100%', marginTop: '20px' }} onClick={onClose}>ปิด 🌿</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Delete Modal ---
export const DeleteModal = ({ isOpen, onClose, onConfirm }: any) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="journal-modal" onClick={e => e.stopPropagation()}>
        <div className="note-card" style={{ textAlign: 'center' }}>
          <h3>จะลบใช่มั้ย กดผิดรึป่าว? 🗑️</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="cancel-btn-styled" onClick={onClose}>ยกเลิก</button>
            <button className="action-btn-main" onClick={onConfirm} style={{ background: '#e29a9a', color: 'white' }}>ลบเลย</button>
          </div>
        </div>
      </div>
    </div>
  );
};