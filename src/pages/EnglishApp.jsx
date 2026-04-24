import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Volume2, Settings, HelpCircle, X, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import vocabData from '../data/vocab.json';

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
    bg: '#1a1a1a',
    cardBg: '#262626',
    text: '#f1f5f9',
    primary: '#3b82f6',
    secondary: '#334155',
    radius: '4px',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: 'none'
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
    border: '1px solid #000'
  }
};

export default function EnglishApp() {
  const navigate = useNavigate();
  const { 
    dailyVocab, lastStudyDate, setDailyVocab, studyLevel, setStudyLevel,
    englishSettings, setEnglishSettings 
  } = useStore();
  
  const theme = themes[englishSettings?.theme] || themes.forest;
  
  const [activeWordId, setActiveWordId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (dailyVocab.length === 0 || lastStudyDate !== today) {
      generateDailyVocab(studyLevel);
    }
  }, [studyLevel]);

  const generateDailyVocab = (level) => {
    const today = new Date().toISOString().slice(0, 10);
    const filteredVocab = vocabData.filter(v => v.category === level);
    const shuffled = [...filteredVocab].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    setDailyVocab(selected, today);
  };

  const handleLevelChange = (newLevel) => {
    setStudyLevel(newLevel);
    generateDailyVocab(newLevel);
  };

  const playPronunciation = (word) => {
    // 方案 A: 嘗試瀏覽器內建語音合成
    if ('speechSynthesis' in window && !/android/i.test(navigator.userAgent)) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      // 方案 B: Android 或不支援系統語音時，使用遠端 API (Google TTS)
      playFallbackAudio(word);
    }
  };

  const playFallbackAudio = (word) => {
    const url = `https://translate.googleapis.com/translate_tts?client=gtx&sl=en&tl=en&q=${encodeURIComponent(word)}`;
    const audio = new Audio(url);
    audio.play().catch(err => {
      console.error('TTS Playback Error:', err);
    });
  };

  const appStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={appStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>每日英文</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Control Bar (Dropdown + Quiz Button) */}
      <div style={{ padding: '12px 16px', background: theme.cardBg, boxShadow: theme.shadow, borderBottom: theme.border, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <select 
              value={studyLevel} 
              onChange={(e) => handleLevelChange(e.target.value)}
              style={{ 
                width: '100%', padding: '10px 16px', paddingRight: '40px', borderRadius: '12px', 
                border: '1px solid ' + theme.secondary, background: theme.bg, color: theme.text,
                fontWeight: 'bold', fontSize: '14px', appearance: 'none', cursor: 'pointer'
              }}
            >
              <option value="basic">初階 (1000 單字)</option>
              <option value="intermediate">中階 (7000 單字)</option>
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
              <ChevronDown size={18} />
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/english/quiz')}
            style={{ 
              background: 'transparent', border: 'none', color: theme.primary, 
              fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', 
              gap: '6px', padding: '8px', cursor: 'pointer'
            }}
          >
            每日測驗 <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <p style={{ opacity: 0.6, marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
          今日核心單字已為您準備好：
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {dailyVocab.map((item, idx) => (
            <motion.div 
              key={item.word}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveWordId(activeWordId === item.word ? null : item.word)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderRadius: theme.radius,
                background: theme.cardBg,
                boxShadow: theme.shadow,
                border: activeWordId === item.word ? '2px solid ' + theme.primary : theme.border,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: theme.primary }}>
                    {item.word}
                  </h3>
                  <span style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px', display: 'block' }}>
                    /{item.phonetic}/
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); playPronunciation(item.word); }}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: theme.secondary, border: 'none', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Volume2 size={20} />
                </button>
              </div>

              <AnimatePresence>
                {activeWordId === item.word && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: '16px', borderTop: '1px solid ' + theme.secondary, paddingTop: '16px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
                        {item.translation} {item.pos && <span style={{fontSize:'12px', opacity: 0.5}}>{item.pos}</span>}
                      </p>
                      {item.sentenceEng && (
                        <div style={{ background: theme.secondary, padding: '12px', borderRadius: '12px', marginTop: '12px' }}>
                          <p style={{ fontSize: '15px', lineHeight: '1.5', marginBottom: '6px' }}>
                            {item.sentenceEng}
                          </p>
                          <p style={{ fontSize: '14px', opacity: 0.7 }}>
                            {item.sentenceChi}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>英文學習設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(themes).map(([key, t]) => (
                <button key={key} onClick={() => setEnglishSettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: englishSettings?.theme === key ? theme.primary : theme.secondary, color: englishSettings?.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
