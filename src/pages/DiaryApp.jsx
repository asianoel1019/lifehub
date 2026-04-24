import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Calendar, List, Settings, 
  X, Save, Trash2, ChevronLeft, ChevronRight, Download,
  Smile, Frown, Angry, Moon, Sun, Cloud, CloudRain, Snowflake,
  Tag, Folder, Type, Clock
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper Components ---

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const MoodIcons = {
  '😊': Smile,
  '😢': Frown,
  '😡': Angry,
  '😴': Moon
};

const WeatherIcons = {
  '☀️': Sun,
  '☁️': Cloud,
  '🌧️': CloudRain,
  '❄️': Snowflake
};

const Fonts = [
  { name: '標準黑體', value: 'Noto Sans TC' },
  { name: '宋體/明體', value: 'Noto Serif TC' },
  { name: '藝術草書', value: 'Ma Shan Zheng' },
  { name: '行書風格', value: 'Liu Jian Mao Cao' },
  { name: '狂草風格', value: 'Zhi Mang Xing' },
  { name: '隨筆手寫', value: 'Indie Flower' },
  { name: '英式手寫', value: 'Caveat' },
  { name: '流暢楷體', value: 'Long Cang' }
];

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

// --- Main App Component ---

export default function DiaryApp() {
  const navigate = useNavigate();
  const { 
    diaryEntries, diaryCategories, diarySettings, 
    addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, 
    setDiarySettings 
  } = useStore();

  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [editingEntry, setEditingEntry] = useState(null); // null | { entry }
  const [showSettings, setShowSettings] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const theme = themes[diarySettings.theme] || themes.forest;

  // Derive styles from settings
  const appStyle = {
    fontFamily: diarySettings.fontFace || 'inherit',
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return diaryEntries.filter(e => {
      const matchQuery = e.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = selectedCategory === '全部' || e.category === selectedCategory;
      return matchQuery && matchCategory;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [diaryEntries, searchQuery, selectedCategory]);

  // --- Handlers ---

  const handleExportTxt = () => {
    const content = diaryEntries.map(e => {
      return `日期: ${e.date}\n分類: ${e.category}\n心情: ${e.mood} 天氣: ${e.weather}\n內容:\n${e.content}\n標籤: ${e.tags?.join(', ')}\n------------------\n`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `我的日記備份_${formatDate(new Date())}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEditor = (entry = null) => {
    if (!entry) {
      setEditingEntry({
        date: formatDate(new Date()),
        content: '',
        mood: '😊',
        weather: '☀️',
        category: '私人',
        tags: []
      });
    } else {
      setEditingEntry(entry);
    }
  };

  // --- Sub-views ---

  const ListView = () => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {filteredEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.3 }}>
          <Folder size={48} style={{ margin: '0 auto 12px' }} />
          <p>找不到符合條件的日記</p>
        </div>
      ) : (
        filteredEntries.map(entry => (
          <motion.div 
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => openEditor(entry)}
            style={{ 
              background: theme.cardBg,
              padding: '20px', 
              borderRadius: theme.radius,
              boxShadow: theme.shadow,
              border: theme.border,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.7 }}>
                  {entry.date}
                </span>
                <span style={{ fontSize: '12px', padding: '2px 8px', background: theme.secondary, borderRadius: '4px' }}>
                  {entry.category}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span>{entry.mood}</span>
                <span>{entry.weather}</span>
              </div>
            </div>
            <p style={{ fontSize: '16px', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: '8px' }}>
              {entry.content}
            </p>
            {entry.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {entry.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '11px', color: theme.primary, background: theme.secondary, padding: '2px 8px', borderRadius: '10px' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const CalendarView = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

    const getEntryForDate = (date) => {
      const dStr = formatDate(date);
      return diaryEntries.find(e => e.date === dStr);
    };

    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', color: 'inherit' }}><ChevronLeft /></button>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</h2>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', color: 'inherit' }}><ChevronRight /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {['日','一','二','三','四','五','六'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', padding: '8px', opacity: 0.5 }}>{d}</div>)}
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;
            const entry = getEntryForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div 
                key={idx}
                onClick={() => entry ? openEditor(entry) : openEditor({ date: formatDate(date), content: '', mood: '😊', weather: '☀️', category: '私人', tags: [] })}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? theme.primary : theme.cardBg,
                  color: isToday ? 'white' : theme.text,
                  borderRadius: theme.radius === '0px' ? '0' : '12px',
                  border: theme.border,
                  cursor: 'pointer', position: 'relative', fontSize: '14px'
                }}
              >
                {date.getDate()}
                {entry && <div style={{ fontSize: '10px', position: 'absolute', top: '2px', right: '2px' }}>{entry.mood}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={appStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>我的日記</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportTxt} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Download size={18} />
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 16px', background: theme.cardBg, boxShadow: theme.shadow, borderBottom: theme.border, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', background: theme.secondary, borderRadius: '24px', padding: '4px' }}>
            <button onClick={() => setView('list')} style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', background: view === 'list' ? theme.cardBg : 'transparent', color: view === 'list' ? theme.primary : theme.text, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <List size={16} /> 列表
            </button>
            <button onClick={() => setView('calendar')} style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', background: view === 'calendar' ? theme.cardBg : 'transparent', color: view === 'calendar' ? theme.primary : theme.text, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={16} /> 日曆
            </button>
          </div>
          <div style={{ position: 'relative', flex: 1, marginLeft: '12px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input type="text" placeholder="搜尋..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '20px', border: theme.border || '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', outline: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['全部', ...diaryCategories].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '4px 12px', borderRadius: '12px', border: 'none', background: selectedCategory === cat ? theme.primary : theme.secondary, color: selectedCategory === cat ? 'white' : theme.text, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        {view === 'list' ? <ListView /> : <CalendarView />}
      </div>

      <motion.button 
        whileTap={{ scale: 0.9 }} onClick={() => openEditor()} 
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: theme.radius === '0px' ? '0' : '28px', background: theme.primary, color: 'white', border: theme.border, boxShadow: theme.shadow || '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      >
        <Plus size={28} />
      </motion.button>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingEntry && (
          <DiaryEditor 
            entry={editingEntry} onClose={() => setEditingEntry(null)} 
            onSave={(data) => { if (data.id) updateDiaryEntry(data.id, data); else addDiaryEntry(data); setEditingEntry(null); }}
            onDelete={(id) => { if (window.confirm('確定要刪除嗎？')) { deleteDiaryEntry(id); setEditingEntry(null); } }}
            settings={diarySettings} categories={diaryCategories} theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>日記設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {Object.entries(themes).map(([key, t]) => (
                    <button key={key} onClick={() => setDiarySettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: diarySettings.theme === key ? theme.primary : theme.secondary, color: diarySettings.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>字體選擇</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {Fonts.map(f => (
                    <button key={f.value} onClick={() => setDiarySettings({ fontFace: f.value })} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: diarySettings.fontFace === f.value ? theme.primary : theme.secondary, color: diarySettings.fontFace === f.value ? 'white' : theme.text, fontFamily: f.value, fontSize: '14px' }}>{f.name}</button>
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

function DiaryEditor({ entry, onClose, onSave, onDelete, settings, categories, theme }) {
  const [data, setData] = useState({ ...entry });
  const [tagInput, setTagInput] = useState('');
  const handleAddTag = () => { if (!tagInput.trim()) return; const clean = tagInput.trim().replace(/^#/, ''); if (!data.tags.includes(clean)) setData({ ...data, tags: [...data.tags, clean] }); setTagInput(''); };
  const removeTag = (t) => setData({ ...data, tags: data.tags.filter(tag => tag !== t) });

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: theme.bg, color: theme.text, display: 'flex', flexDirection: 'column', fontFamily: settings.fontFace }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: theme.border || '1px solid ' + theme.secondary }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
        <h3 style={{ fontWeight: 'bold' }}>{data.id ? '編輯日記' : '新日記'}</h3>
        <button onClick={() => onSave(data)} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: 'bold' }}><Save size={18} /> 儲存</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} style={{ padding: '8px 12px', borderRadius: '12px', border: theme.border || '1px solid ' + theme.secondary, background: theme.cardBg, color: 'inherit', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '4px', background: theme.secondary, padding: '4px', borderRadius: '24px' }}>
            {['😊', '😢', '😡', '😴'].map(m => <button key={m} onClick={() => setData({ ...data, mood: m })} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: data.mood === m ? theme.primary : 'transparent', color: data.mood === m ? 'white' : 'inherit' }}>{m}</button>)}
          </div>
          <div style={{ display: 'flex', gap: '4px', background: theme.secondary, padding: '4px', borderRadius: '24px' }}>
            {['☀️', '☁️', '🌧️', '❄️'].map(w => <button key={w} onClick={() => setData({ ...data, weather: w })} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: data.weather === w ? theme.primary : 'transparent', color: data.weather === w ? 'white' : 'inherit' }}>{w}</button>)}
          </div>
        </div>
        <select value={data.category} onChange={e => setData({ ...data, category: e.target.value })} style={{ padding: '8px 12px', borderRadius: '12px', border: theme.border || '1px solid ' + theme.secondary, background: theme.cardBg, color: 'inherit', outline: 'none' }}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <textarea autoFocus placeholder="寫點什麼吧..." value={data.content} onChange={e => setData({ ...data, content: e.target.value })} style={{ flex: 1, minHeight: '30vh', padding: '16px', borderRadius: theme.radius, border: theme.border || 'none', background: theme.cardBg, color: 'inherit', fontSize: '18px', lineHeight: 1.6, outline: 'none', resize: 'none', boxShadow: theme.shadow }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input type="text" placeholder="新增標籤 (Enter)" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} style={{ background: 'none', border: 'none', borderBottom: '1px solid ' + theme.secondary, color: 'inherit', outline: 'none', padding: '8px' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.tags.map(t => <span key={t} onClick={() => removeTag(t)} style={{ padding: '4px 12px', background: theme.primary, color: 'white', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}>#{t} ×</span>)}
          </div>
        </div>
        {data.id && <button onClick={() => onDelete(data.id)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444' }}>刪除日記</button>}
      </div>
    </motion.div>
  );
}
