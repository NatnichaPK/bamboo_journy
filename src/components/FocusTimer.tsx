import React, { useState, useEffect } from 'react';

const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);

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

  return (
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
        onClick={(e) => { if (isTimerExpanded) { e.stopPropagation(); setIsTimerExpanded(false); } }}>
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
          <button onClick={(e) => { e.stopPropagation(); setIsTimerRunning(false); setTimeLeft(timerMode === 'work' ? 25 * 60 : 5 * 60); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6 }}>↺</button>
          <button onClick={(e) => { e.stopPropagation(); setIsTimerExpanded(false); }}
            style={{ fontSize: '1rem', opacity: 0.3, background: 'none', border: 'none', marginLeft: '5px' }}>✕</button>
        </div>
      )}
      {!isTimerExpanded && isTimerRunning && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FF6B6B', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', animation: 'pulse 2s infinite' }}></div>
      )}
    </div>
  );
};

export default FocusTimer;