import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, X, BookOpen, RefreshCw, Hand, Search } from 'lucide-react';
import { answersData } from '../data/answers';

const themes = {
  cartoon: {
    name: '可愛卡通',
    bg: '#fff1f2',
    cardBg: 'white',
    text: '#881337',
    primary: '#fb7185',
    secondary: '#fbcfe8',
    radius: '24px',
    shadow: '0 8px 0 rgba(251, 113, 133, 0.1)',
    border: 'none'
  },
  serious: {
    name: '專業嚴肅',
    bg: '#121212',
    cardBg: '#1e1e1e',
    text: '#f1f5f9',
    primary: '#8b5cf6',
    secondary: '#334155',
    radius: '4px',
    shadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    border: '1px solid #333'
  },
  forest: {
    name: '清新森林',
    bg: '#f0fdf4',
    cardBg: 'white',
    text: '#166534',
    primary: '#22c55e',
    secondary: '#dcfce7',
    radius: '16px',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: 'none'
  },
  minimalist: {
    name: '極簡黑白',
    bg: '#ffffff',
    cardBg: 'white',
    text: '#000000',
    primary: '#000000',
    secondary: '#f3f4f6',
    radius: '0px',
    shadow: 'none',
    border: '1px solid #e5e7eb'
  }
};

const guideTexts = [
  "在心中默念一個你正在糾結的問題",
  "閉上眼睛，深呼吸三次",
  "平靜下來後，點擊下方開啟解答"
];

export default function AnswerBookApp() {
  const navigate = useNavigate();
  const { answerBookSettings, setAnswerBookSettings } = useStore();
  const theme = themes[answerBookSettings?.theme] || themes.cartoon;

  const [step, setStep] = useState(0); // 0, 1, 2 = guide steps. 3 = answer result
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pageInput, setPageInput] = useState('');

  // Generate random answer
  const fetchRandomAnswer = () => {
    const randomIndex = Math.floor(Math.random() * answersData.length);
    setCurrentAnswer(answersData[randomIndex]);
    setStep(3);
  };

  const fetchSpecificPage = (pageNum) => {
    const p = parseInt(pageNum, 10);
    if (!isNaN(p) && p > 0 && p <= answersData.length) {
      setCurrentAnswer(answersData[p - 1]);
      setStep(3);
    } else {
      alert(`請輸入 1 到 ${answersData.length} 之間的頁碼`);
    }
  };

  const handleNextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else if (step === 2) {
      fetchRandomAnswer();
    }
  };

  const handleReset = () => {
    setStep(0);
    setCurrentAnswer(null);
    setPageInput('');
  };

  // Render book pages style
  const renderBookContent = () => {
    if (step < 3) {
      return (
        <motion.div 
          key="guide"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}
          onClick={handleNextStep}
        >
          <BookOpen size={64} color={theme.primary} style={{ marginBottom: '32px', opacity: 0.8 }} />
          <h2 style={{ fontSize: '24px', lineHeight: '1.6', fontWeight: 'bold' }}>
            {guideTexts[step]}
          </h2>
          {step === 0 && (
             <p style={{ marginTop: '16px', opacity: 0.6, fontSize: '14px' }}>
               (例如：我應該接受那個工作嗎？)
             </p>
          )}
          <div style={{ marginTop: '48px', display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === step ? theme.primary : theme.secondary, transition: 'background 0.3s' }} />
            ))}
          </div>
          <p style={{ marginTop: '24px', fontSize: '13px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
             <Hand size={14} /> 點擊畫面繼續
          </p>
        </motion.div>
      );
    }

    if (step === 3 && currentAnswer) {
      return (
        <motion.div 
          key="result"
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring', damping: 20 }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: theme.primary }}>
              {currentAnswer.answer}
            </h1>
            <div style={{ padding: '20px', background: theme.secondary, borderRadius: theme.radius === '0px' ? '0' : '12px', fontSize: '16px', lineHeight: '1.8', fontStyle: 'italic', color: theme.text, opacity: 0.9 }}>
              "{currentAnswer.explanation}"
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', opacity: 0.5, fontSize: '14px' }}>
             <span>Page: {currentAnswer.page} / {answersData.length}</span>
             <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
               <RefreshCw size={16} /> 再問一次
             </button>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100dvh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(12px + env(safe-area-inset-top, 0px)) 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>答案之書</h1>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        
        {/* Book Container */}
        <div style={{
           width: '100%',
           maxWidth: '400px',
           height: '60vh',
           minHeight: '400px',
           background: theme.cardBg,
           borderRadius: theme.radius,
           boxShadow: theme.shadow,
           border: theme.border,
           position: 'relative',
           overflow: 'hidden',
           display: 'flex',
           flexDirection: 'column'
        }}>
           <AnimatePresence mode="wait">
             {renderBookContent()}
           </AnimatePresence>
        </div>

        {/* Direct Page Input Area */}
        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: theme.cardBg, padding: '20px', borderRadius: '24px', boxShadow: theme.shadow, border: theme.border, width: '100%', maxWidth: '400px' }}
          >
             {/* Slider for quick flip */}
             <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.primary }}>1</span>
               <input 
                 type="range"
                 min="1"
                 max={answersData.length}
                 value={currentAnswer?.page || 1}
                 onChange={(e) => {
                   setPageInput(e.target.value);
                   fetchSpecificPage(e.target.value);
                 }}
                 style={{ flex: 1, accentColor: theme.primary, cursor: 'pointer' }}
               />
               <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.primary }}>{answersData.length}</span>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <span style={{ fontSize: '14px', fontWeight: 'bold' }}>直接翻頁</span>
               <input 
                 type="number"
                 min="1"
                 max={answersData.length}
                 value={pageInput}
                 onChange={(e) => setPageInput(e.target.value)}
                 placeholder="1-336"
                 style={{ width: '80px', padding: '8px', border: 'none', borderBottom: `2px solid ${theme.secondary}`, outline: 'none', background: 'transparent', color: theme.text, textAlign: 'center' }}
               />
               <button 
                 onClick={() => fetchSpecificPage(pageInput)}
                 style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
               >
                 <Search size={16} />
               </button>
             </div>
          </motion.div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>應用模組設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X /></button>
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block', opacity: 0.7 }}>主題風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button 
                    key={key} 
                    onClick={() => { setAnswerBookSettings({ theme: key }); }} 
                    style={{ 
                      padding: '12px 0', 
                      borderRadius: theme.radius === '0px' ? '0' : '12px', 
                      border: theme.border || 'none', 
                      background: answerBookSettings?.theme === key ? theme.primary : theme.secondary, 
                      color: answerBookSettings?.theme === key ? 'white' : theme.text, 
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
