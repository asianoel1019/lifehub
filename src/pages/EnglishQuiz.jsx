import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, UserCheck, RefreshCw, X, ChevronRight } from 'lucide-react';
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
    border: 'none',
    progress: '#fb7185'
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
    border: 'none',
    progress: '#3b82f6'
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
    border: 'none',
    progress: '#22c55e'
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
    border: '1px solid #000',
    progress: '#000'
  }
};

export default function EnglishQuiz() {
  const navigate = useNavigate();
  const { dailyVocab, studyLevel, englishSettings } = useStore();
  const theme = themes[englishSettings?.theme] || themes.forest;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (dailyVocab.length > 0) generateQuestions();
  }, [dailyVocab]);

  const generateQuestions = () => {
    const pool = vocabData.filter(v => v.category === studyLevel);
    const newQuestions = dailyVocab.map(wordItem => {
      const others = pool.filter(v => v.word !== wordItem.word);
      const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [wordItem, ...shuffledOthers].map(o => ({
        text: o.translation,
        word: o.word,
        isCorrect: o.word === wordItem.word
      }));
      return {
        word: wordItem.word,
        phonetic: wordItem.phonetic,
        options: options.sort(() => 0.5 - Math.random())
      };
    });
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
  };

  const handleOptionSelect = (option) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    if (option.isCorrect) setScore(s => s + 1);
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else setShowResult(true);
    }, 1000);
  };

  const appStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  if (dailyVocab.length === 0) {
    return <div style={appStyle}><div style={{ padding: '40px', textAlign: 'center' }}>載入中...</div></div>;
  }

  const currentQ = questions[currentIndex];

  return (
    <div style={appStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/english')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>每日測驗</h1>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>
          {showResult ? '已完成' : `${currentIndex + 1} / ${questions.length}`}
        </div>
      </div>

      <div className="page-content" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        
        {showResult ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              background: theme.cardBg, padding: '40px 24px', borderRadius: theme.radius, 
              boxShadow: theme.shadow, border: theme.border, textAlign: 'center', margin: 'auto 0' 
            }}
          >
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '50%', 
              background: score >= 6 ? theme.primary : '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '40px', fontWeight: 'bold' }}>{score}</h2>
            </div>
            
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {score >= 8 ? '太棒了！' : score >= 6 ? '做的不錯！' : '再接再厲！'}
            </h3>
            <p style={{ opacity: 0.6, marginBottom: '32px' }}>
              得分：{score} / {questions.length} 分
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={generateQuestions}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: theme.secondary, color: theme.primary, border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={18} /> 再測一次
              </button>
              <button 
                onClick={() => navigate('/english')}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold' }}
              >
                返回學習頁
              </button>
            </div>
          </motion.div>
        ) : currentQ ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '6px', background: theme.secondary, borderRadius: '3px', marginBottom: '48px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                style={{ height: '100%', background: theme.primary, borderRadius: '3px' }}
              />
            </div>
            
            <motion.div
              layout
              key={currentIndex}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div style={{ 
                background: theme.cardBg, width: '100%', padding: '32px 16px', 
                borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border,
                textAlign: 'center', marginBottom: '32px'
              }}>
                <h2 style={{ fontSize: '42px', fontWeight: '900', color: theme.primary, marginBottom: '8px' }}>
                  {currentQ.word}
                </h2>
                <p style={{ fontSize: '18px', opacity: 0.5 }}>
                  /{currentQ.phonetic}/
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', width: '100%' }}>
                {currentQ.options.map((opt, idx) => {
                  let btnBg = theme.cardBg;
                  let btnBorder = theme.border || '1px solid ' + theme.secondary;
                  let btnText = theme.text;
                  
                  if (selectedOption !== null) {
                    if (opt.isCorrect) {
                      btnBg = '#10b981';
                      btnBorder = '1px solid #10b981';
                      btnText = 'white';
                    } else if (selectedOption.word === opt.word && !opt.isCorrect) {
                      btnBg = '#ef4444';
                      btnBorder = '1px solid #ef4444';
                      btnText = 'white';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(opt)}
                      style={{
                        padding: '18px', fontSize: '18px', fontWeight: 'bold',
                        background: btnBg, border: btnBorder, borderRadius: theme.radius,
                        color: btnText, boxShadow: theme.shadow,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s', cursor: selectedOption ? 'default' : 'pointer'
                      }}
                    >
                      {opt.text}
                      <ChevronRight size={20} opacity={0.3} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
