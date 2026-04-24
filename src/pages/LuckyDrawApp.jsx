import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ArrowLeft, RotateCcw, Hash, Coins, Plus, Trash2, Edit2, Play, Check, X, ChevronRight, Settings2, Utensils, Settings, ChevronDown } from 'lucide-react';

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
    accent: '#e11d48'
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
    accent: '#3b82f6'
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
    accent: '#22c55e'
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
    accent: '#000000'
  }
};

export default function LuckyDrawApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('wheel'); // 'wheel', 'number', 'coin', 'lunch'

  // Store state
  const {
    luckyDrawWheels, addLuckyDrawWheel, updateLuckyDrawWheel, deleteLuckyDrawWheel,
    luckyDrawSettings, setLuckyDrawSettings
  } = useStore();

  const theme = themes[luckyDrawSettings?.theme] || themes.forest;
  const [showThemeSettings, setShowThemeSettings] = useState(false);

  const containerStyle = {
    background: theme.bg,
    minHeight: '100dvh',
    color: theme.text,
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div className="page-container" style={containerStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              borderRadius: '50%', width: '36px', height: '36px', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>抽籤工具箱</h1>
        </div>
        <button
          onClick={() => setShowThemeSettings(true)}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            borderRadius: '50%', width: '36px', height: '36px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        padding: '12px 10px',
        gap: '6px',
        background: theme.cardBg,
        boxShadow: theme.shadow,
        borderBottom: theme.border,
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'wheel', label: '轉盤', icon: RotateCcw },
          { id: 'number', label: '亂數', icon: Hash },
          { id: 'coin', label: '硬幣', icon: Coins },
          { id: 'lunch', label: '午餐', icon: Utensils }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              minWidth: '70px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: theme.radius,
              border: 'none',
              background: activeTab === tab.id ? theme.primary : 'transparent',
              color: activeTab === tab.id ? 'white' : theme.text,
              opacity: activeTab === tab.id ? 1 : 0.6,
              fontWeight: activeTab === tab.id ? 'bold' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={18} />
            <span style={{ fontSize: '12px' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="page-content" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'wheel' && <WheelTab theme={theme} wheels={luckyDrawWheels} onAdd={addLuckyDrawWheel} onUpdate={updateLuckyDrawWheel} onDelete={deleteLuckyDrawWheel} />}
            {activeTab === 'number' && <NumberTab theme={theme} />}
            {activeTab === 'coin' && <CoinTab theme={theme} />}
            {activeTab === 'lunch' && <LunchTab theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Theme Settings Modal */}
      {showThemeSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>介面設定</h3>
              <button onClick={() => setShowThemeSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block', opacity: 0.7 }}>風格分組</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(themes).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setLuckyDrawSettings({ theme: key })}
                  style={{
                    padding: '12px', borderRadius: '12px', border: 'none',
                    background: luckyDrawSettings?.theme === key ? theme.primary : theme.secondary,
                    color: luckyDrawSettings?.theme === key ? 'white' : theme.text,
                    fontSize: '13px', fontWeight: 'bold'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Wheel Tab Component ---
function WheelTab({ theme, wheels, onAdd, onUpdate, onDelete }) {
  const [selectedWheelId, setSelectedWheelId] = useState(wheels[0]?.id || 'default');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const currentWheel = wheels.find(w => w.id === selectedWheelId) || wheels[0];
  const items = currentWheel?.items || [];

  const canvasRef = useRef(null);
  const rotationRef = useRef(0);

  // Wheel Colors (based on theme or fixed vibrant ones)
  const colors = [
    '#FDA4AF', '#FCD34D', '#6EE7B7', '#93C5FD', '#C4B5FD', '#F9A8D4',
    '#FB7185', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F472B6'
  ];

  useEffect(() => {
    drawWheel();
  }, [items, selectedWheelId, theme]);

  const drawWheel = (rotation = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (items.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = theme.secondary;
      ctx.fill();
      ctx.strokeStyle = theme.primary;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '24px sans-serif';
      ctx.fillText('請新增選項', centerX, centerY);
      return;
    }

    const angleStep = (Math.PI * 2) / items.length;

    items.forEach((item, i) => {
      const startAngle = i * angleStep + rotation;
      const endAngle = (i + 1) * angleStep + rotation;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angleStep / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(item.length > 10 ? item.substring(0, 9) + '...' : item, radius - 30, 8);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const handleSpin = () => {
    if (isSpinning || items.length === 0) return;

    setIsSpinning(true);
    setResult(null);

    const spinRotations = 5 + Math.random() * 5; // 5 to 10 full rotations
    const targetRotation = rotationRef.current + spinRotations * Math.PI * 2;
    const duration = 4000;
    const startTime = performance.now();
    const startRotation = rotationRef.current;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (targetRotation - startRotation) * easedProgress;

      rotationRef.current = currentRotation;
      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calculate result
        // The pointer is at 0 radians (right side), but segments were drawn clockwise
        // Total rotation = currentRotation % (2*PI)
        // Adjust for the fact that we want the item at the TOP or RIGHT?
        // Let's say pointer is at -PI/2 (top)
        const finalRotation = currentRotation % (Math.PI * 2);
        const segmentAngle = (Math.PI * 2) / items.length;

        // Final Rotation is how much the wheel turned clockwise.
        // Item 0 is at [0, segmentAngle].
        // To find what's at 0 rad (right side):
        // (2*PI - finalRotation) is the angle of the pointer relative to the wheel's initial 0 rad.
        let pointerAngle = (Math.PI * 2 - (finalRotation % (Math.PI * 2))) % (Math.PI * 2);
        const winIndex = Math.floor(pointerAngle / segmentAngle);
        setResult(items[winIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    onUpdate(selectedWheelId, { items: [...items, newItemText.trim()] });
    setNewItemText('');
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate(selectedWheelId, { items: newItems });
  };

  const handleAddWheel = () => {
    const name = prompt('輸入新轉盤名稱');
    if (name) {
      onAdd(name);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      {/* Wheel Selection */}
      <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <select
            value={selectedWheelId}
            onChange={(e) => setSelectedWheelId(e.target.value)}
            style={{
              width: '100%', padding: '12px', borderRadius: theme.radius, border: theme.border,
              background: theme.cardBg, color: theme.text, fontWeight: 'bold', appearance: 'none',
              boxShadow: theme.shadow
            }}
          >
            {wheels.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <ChevronDown size={18} opacity={0.5} />
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '12px', background: theme.cardBg, border: theme.border,
            borderRadius: theme.radius, color: theme.primary, boxShadow: theme.shadow
          }}
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* Wheel Area */}
      <div style={{ position: 'relative', width: '280px', height: '280px' }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, width: 0, height: 0, borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent', borderRight: '20px solid ' + theme.primary
        }} />

        <canvas
          ref={canvasRef}
          width={560}
          height={560}
          style={{ width: '100%', height: '100%', borderRadius: '50%', boxShadow: theme.shadow }}
        />
      </div>

      {/* Spin Button / Result */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              style={{
                padding: '16px', background: theme.cardBg, borderRadius: theme.radius,
                border: theme.border || `2px solid ${theme.primary}`, boxShadow: theme.shadow,
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '4px' }}>中獎結果</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: theme.primary }}>{result}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          onClick={handleSpin}
          disabled={isSpinning || items.length < 2}
          style={{
            width: '100%', padding: '16px', borderRadius: theme.radius, border: 'none',
            background: isSpinning || items.length < 2 ? theme.secondary : theme.primary,
            color: 'white', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: theme.shadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Play size={20} />
          {isSpinning ? '轉動中...' : '開始抽籤'}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end'
        }}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            style={{
              width: '100%', background: theme.cardBg, borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px', padding: '24px', maxHeight: '80vh', overflowY: 'auto',
              color: theme.text
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>管理轉盤庫</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: 'inherit' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAddWheel}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '12px', border: `1px dashed ${theme.primary}`,
                    color: theme.primary, background: 'transparent', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}
                >
                  <Plus size={18} /> 新增轉盤
                </button>
                <button
                  onClick={() => {
                    if (wheels.length <= 1) return alert('至少需保留一個轉盤');
                    if (confirm('確定刪除此轉盤？')) {
                      onDelete(selectedWheelId);
                      setSelectedWheelId(wheels[0].id);
                    }
                  }}
                  style={{
                    padding: '12px', borderRadius: '12px', border: 'none',
                    color: '#ef4444', background: '#fee2e2'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.6, marginBottom: '10px' }}>選項編輯 ({items.length})</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="輸入新選項..."
                    style={{
                      flex: 1, padding: '12px', borderRadius: '12px',
                      border: `1px solid ${theme.secondary}`, outline: 'none',
                      background: theme.bg, color: theme.text
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  />
                  <button
                    onClick={handleAddItem}
                    style={{ padding: '12px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: theme.secondary, borderRadius: '12px', opacity: 0.8 }}>
                      <span style={{ fontSize: '14px' }}>{item}</span>
                      <button onClick={() => removeItem(idx)} style={{ color: theme.text, opacity: 0.5, background: 'transparent', border: 'none' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Number Tab Component ---
function NumberTab({ theme }) {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNumbers = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newResults = [];
      for (let i = 0; i < count; i++) {
        newResults.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      setResults(newResults);
      setIsGenerating(false);
    }, 600);
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.secondary}`,
    outline: 'none', background: theme.bg, color: theme.text, fontWeight: 'bold'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '20px', background: theme.cardBg, borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6, display: 'block', marginBottom: '6px' }}>最小值</label>
            <input type="number" value={min} onChange={e => setMin(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6, display: 'block', marginBottom: '6px' }}>最大值</label>
            <input type="number" value={max} onChange={e => setMax(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6, display: 'block', marginBottom: '6px' }}>生成數量 ({count})</label>
          <input
            type="range" min="1" max="10" value={count}
            onChange={e => setCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.primary }}
          />
        </div>

        <button
          onClick={generateNumbers}
          disabled={isGenerating || min >= max}
          style={{
            width: '100%', marginTop: '24px', padding: '16px', borderRadius: theme.radius, border: 'none',
            background: isGenerating || min >= max ? theme.secondary : theme.primary,
            color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: theme.shadow
          }}
        >
          {isGenerating ? '生成中...' : '產生亂數'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        <AnimatePresence>
          {results.map((n, i) => (
            <motion.div
              key={`${i}-${n}`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              style={{
                width: '60px', height: '60px', borderRadius: '50%', background: theme.cardBg,
                border: `2px solid ${theme.primary}`, color: theme.primary, fontWeight: 'bold', fontSize: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: theme.shadow
              }}
            >
              {n}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Coin Tab Component ---
function CoinTab({ theme }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [side, setSide] = useState(null);
  const [history, setHistory] = useState([]);

  const flipCoin = () => {
    setIsFlipping(true);
    setSide(null);

    setTimeout(() => {
      const newSide = Math.random() > 0.5 ? 'heads' : 'tails';
      setSide(newSide);
      setIsFlipping(false);
      setHistory(prev => [newSide, ...prev].slice(0, 5));
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
      <div style={{ perspective: '1000px', width: '200px', height: '200px' }}>
        <motion.div
          animate={isFlipping ? {
            rotateY: [0, 1800],
            y: [0, -100, 0]
          } : { rotateY: side === 'tails' ? 180 : 0 }}
          transition={isFlipping ? { duration: 1.5, ease: "easeInOut" } : { duration: 0.6 }}
          style={{
            width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
          }}
        >
          {/* Heads */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            border: '6px solid #b45309', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backfaceVisibility: 'hidden', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '60px' }}>🌞</div>
            <div style={{ position: 'absolute', bottom: '20px', fontSize: '13px', fontWeight: 'bold', color: '#78350f' }}>HEADS</div>
          </div>
          
          {/* Tails */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
            background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)',
            border: '6px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '60px' }}>🌙</div>
            <div style={{ position: 'absolute', bottom: '20px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>TAILS</div>
          </div>
        </motion.div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: theme.primary, minHeight: '36px', marginBottom: '12px' }}>
          {side === 'heads' ? '正面 (🌞)' : side === 'tails' ? '反面 (🌙)' : ''}
        </h2>

        <button
          onClick={flipCoin}
          disabled={isFlipping}
          style={{
            padding: '16px 48px', borderRadius: '30px', border: 'none',
            background: theme.primary,
            color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: theme.shadow
          }}
        >
          {isFlipping ? '投擲中...' : '開始投擲'}
        </button>
      </div>

      {history.length > 0 && (
        <div style={{ width: '100%', marginTop: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', opacity: 0.6, marginBottom: '12px' }}>最近紀錄</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {history.map((h, i) => (
              <div key={i} style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: h === 'heads' ? '#fffbeb' : '#f1f5f9',
                border: `1px solid ${h === 'heads' ? '#fbbf24' : '#cbd5e1'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>
                  {h === 'heads' ? '🌞' : '🌙'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Lunch Tab Component (The NEW Flip Game) ---
function LunchTab({ theme }) {
  const { lunchCategories, setLunchCategories, updateLunchCategory } = useStore();
  const [numCards, setNumCards] = useState(5);
  const [cards, setCards] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Card results format: { category, option, isFlipped }
  const roll = () => {
    setIsRolling(true);
    // Reset cards to empty then fill with items
    const activeCats = lunchCategories.filter(c => c.active && c.items.length > 0);
    if (activeCats.length === 0) {
      alert('請至少勾選一個有內容的種類');
      setIsRolling(false);
      return;
    }

    const newCards = [];
    for (let i = 0; i < numCards; i++) {
      const randomCat = activeCats[Math.floor(Math.random() * activeCats.length)];
      const randomItem = randomCat.items[Math.floor(Math.random() * randomCat.items.length)];
      newCards.push({
        category: randomCat.name,
        option: randomItem,
        isFlipped: false
      });
    }

    setCards(newCards);

    // Auto flip animation sequence
    setTimeout(() => {
      setIsRolling(false);
    }, 500);
  };

  const handleFlip = (index) => {
    if (isRolling) return;
    setCards(prev => prev.map((c, i) => i === index ? { ...c, isFlipped: !c.isFlipped } : c));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls */}
      <div style={{
        padding: '16px', background: theme.cardBg, borderRadius: theme.radius,
        boxShadow: theme.shadow, border: theme.border, display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.7 }}>抽取數量: {numCards} 張</span>
          <button
            onClick={() => setShowSettings(true)}
            style={{ background: 'transparent', border: 'none', color: theme.primary, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold' }}
          >
            <Settings2 size={16} /> 編輯種類
          </button>
        </div>
        <input
          type="range" min="3" max="10" value={numCards}
          onChange={(e) => setNumCards(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: theme.primary }}
        />
        <button
          onClick={roll}
          disabled={isRolling}
          style={{
            width: '100%', padding: '14px', borderRadius: theme.radius, border: 'none',
            background: isRolling ? theme.secondary : theme.primary, color: 'white',
            fontWeight: 'bold', fontSize: '16px', boxShadow: theme.shadow
          }}
        >
          {isRolling ? '洗牌中...' : '洗牌並發牌'}
        </button>
      </div>

      {/* Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        paddingBottom: '20px'
      }}>
        <AnimatePresence>
          {cards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => handleFlip(idx)}
              style={{
                perspective: '1000px',
                height: '140px',
                cursor: 'pointer'
              }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotateY: card.isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                style={{
                  width: '100%', height: '100%', position: 'relative',
                  transformStyle: 'preserve-3d', transition: 'transform 0.6s'
                }}
              >
                {/* Back (Closed) */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%',
                  borderRadius: '16px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent || '#e11d48'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backfaceVisibility: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  border: '4px solid white'
                }}>
                  <Utensils size={40} color="white" opacity={0.5} />
                  <div style={{ position: 'absolute', bottom: '10px', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>點擊翻開</div>
                </div>

                {/* Front (Open) */}
                <div style={{
                  position: 'absolute', width: '100%', height: '100%',
                  borderRadius: '16px', background: theme.cardBg,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)', border: `2px solid ${theme.primary}`,
                  padding: '10px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: theme.text, opacity: 0.5, marginBottom: '6px' }}>{card.category}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.primary, lineHeight: 1.2 }}>{card.option}</div>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {cards.length === 0 && !isRolling && (
        <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.4 }}>
          <Utensils size={48} style={{ margin: '0 auto 12px' }} />
          <p>點擊上方按鈕開始決定午餐！</p>
        </div>
      )}

      {/* Lunch Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <motion.div
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            style={{
              width: '90%', maxWidth: '400px', background: theme.cardBg, borderRadius: '24px',
              padding: '24px', maxHeight: '80vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>管理午餐選項</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {lunchCategories.map(cat => (
                <div key={cat.id} style={{ padding: '16px', border: `1px solid ${theme.secondary}`, borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox" checked={cat.active}
                        onChange={() => {
                          const newCats = lunchCategories.map(c => c.id === cat.id ? { ...c, active: !c.active } : c);
                          setLunchCategories(newCats);
                        }}
                      />
                      <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newName = prompt('修改種類名稱', cat.name);
                        if (newName) updateLunchCategory(cat.id, newName, cat.items);
                      }}
                      style={{ background: 'transparent', border: 'none', color: theme.primary }}
                    ><Edit2 size={14} /></button>
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '8px' }}>
                    {cat.items.join(', ')}
                  </div>
                  <button
                    onClick={() => {
                      const newItemsStr = prompt('修改選項 (用空格分開)', cat.items.join(' '));
                      if (newItemsStr !== null) {
                        const items = newItemsStr.split(/\s+/).filter(i => i.trim());
                        updateLunchCategory(cat.id, cat.name, items);
                      }
                    }}
                    style={{ fontSize: '12px', background: theme.secondary, border: 'none', padding: '6px 12px', borderRadius: '8px', color: theme.text }}
                  >快速編輯內容</button>
                </div>
              ))}

              <button
                onClick={() => {
                  const name = prompt('新增種類名稱');
                  if (name) {
                    setLunchCategories([...lunchCategories, { id: Date.now().toString(), name, items: ['新選項'], active: true }]);
                  }
                }}
                style={{ padding: '12px', border: `1px dashed ${theme.primary}`, background: 'transparent', color: theme.primary, borderRadius: '12px', fontWeight: 'bold' }}
              >+ 新增分組</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
