import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, TrendingUp, Target, 
  ChevronLeft, ChevronRight, Scale,
  Calendar, Trophy, Trash2,
  BarChart3, X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { format, subDays, isAfter, startOfDay, parseISO, isValid } from 'date-fns';

// --- Theme Configurations ---

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
    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
    chartLine: '#fb7185',
    accent: '#f472b6'
  },
  serious: {
    name: '專業嚴肅',
    bg: '#0f172a',
    cardBg: '#1e293b',
    text: '#f8fafc',
    primary: '#3b82f6',
    secondary: '#334155',
    radius: '4px',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    fontFamily: 'system-ui, sans-serif',
    chartLine: '#3b82f6',
    accent: '#60a5fa'
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
    fontFamily: 'serif',
    chartLine: '#15803d',
    accent: '#4ade80'
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
    fontFamily: 'monospace',
    chartLine: '#000000',
    accent: '#000'
  }
};

// --- Helper Functions ---

const calculateBMI = (w, h) => {
  if (!w || !h || isNaN(w) || isNaN(h)) return 0;
  return (w / (Math.pow(h / 100, 2))).toFixed(1);
};

const getBMICategory = (bmi) => {
  const n = parseFloat(bmi);
  if (isNaN(n) || n === 0) return { label: '未填寫', color: '#94a3b8' };
  if (n < 18.5) return { label: '體重過輕', color: '#60a5fa' };
  if (n < 24) return { label: '正常範圍', color: '#10b981' };
  if (n < 27) return { label: '過重', color: '#f59e0b' };
  return { label: '肥胖', color: '#ef4444' };
};

const getSafeDateString = (date) => {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
};

export default function WeightApp() {
  const navigate = useNavigate();
  const { 
    weightEntries = [], weightGoal = { targetWeight: 0, weeklyLossGoal: 0.5, height: 0 }, 
    weightSettings = { theme: 'forest' },
    addWeightEntry, deleteWeightEntry, setWeightGoal, setWeightSettings 
  } = useStore();

  const [view, setView] = useState('chart'); // 'chart' | 'calendar'
  const [dateRange, setDateRange] = useState('7d');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const theme = themes[weightSettings?.theme] || themes.forest;

  // Derive charts data
  const chartData = useMemo(() => {
    let filtered = [...weightEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (dateRange === '7d') {
      const cutOff = subDays(new Date(), 7);
      filtered = filtered.filter(e => isAfter(parseISO(e.date), cutOff));
    } else if (dateRange === '30d') {
      const cutOff = subDays(new Date(), 30);
      filtered = filtered.filter(e => isAfter(parseISO(e.date), cutOff));
    }
    return filtered.map(e => ({
      ...e,
      displayDate: format(parseISO(e.date), 'MM/dd')
    }));
  }, [weightEntries, dateRange]);

  const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : 0;
  const bmi = calculateBMI(currentWeight, weightGoal?.height);
  const bmiInfo = getBMICategory(bmi);

  const stats = useMemo(() => {
    if (!weightEntries || weightEntries.length === 0) return { streak: 0, weeklyLoss: 0, avgChange: 0 };
    
    let streak = 0;
    const sorted = [...weightEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = startOfDay(new Date());
    for (let i = 0; i < sorted.length; i++) {
        const d = startOfDay(parseISO(sorted[i].date));
        const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
        if (diff === streak || diff === streak - 1) streak++;
        else break;
    }

    const lastWeight = sorted[0].weight;
    const sevenDaysAgo = subDays(new Date(), 7);
    const prevWeightEntry = sorted.find(e => isAfter(sevenDaysAgo, parseISO(e.date)));
    const weeklyLoss = prevWeightEntry ? (prevWeightEntry.weight - lastWeight).toFixed(1) : 0;

    const firstWeight = sorted[sorted.length - 1].weight;
    const avgChange = weightEntries.length > 1 ? ((firstWeight - lastWeight) / weightEntries.length).toFixed(2) : 0;

    return { streak, weeklyLoss, avgChange };
  }, [weightEntries]);

  // Goal calculations with crash protection
  const targetWeight = weightGoal?.targetWeight || 0;
  const weeklyLossGoal = weightGoal?.weeklyLossGoal || 0.5;
  const remainingKg = currentWeight > 0 && targetWeight > 0 ? (currentWeight - targetWeight).toFixed(1) : 0;
  
  const estWeeks = (parseFloat(remainingKg) > 0 && weeklyLossGoal > 0) ? (parseFloat(remainingKg) / weeklyLossGoal) : 0;
  
  let estCompletionDate = '---';
  if (isFinite(estWeeks) && estWeeks > 0) {
    try {
        const dateObj = subDays(new Date(), -Math.ceil(estWeeks * 7));
        if (isValid(dateObj)) {
            estCompletionDate = format(dateObj, 'yyyy/MM/dd');
        }
    } catch(e) {
        estCompletionDate = '---';
    }
  }

  const Card = ({ children, style = {}, ...props }) => (
    <div 
      {...props}
      style={{
        background: theme.cardBg,
        borderRadius: theme.radius,
        padding: '20px',
        boxShadow: theme.shadow,
        border: theme.border,
        ...style
      }}
    >
      {children}
    </div>
  );

  const openEditorForDate = (dateStr) => {
    const existing = weightEntries.find(e => e.date === dateStr);
    setEditingEntry({ date: dateStr, weight: existing ? existing.weight : currentWeight || 0 });
    setShowAddModal(true);
  };

  // --- Calendar Logic ---
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  return (
    <div style={{ 
      background: theme.bg, 
      height: '100dvh', 
      display: 'flex', 
      flexDirection: 'column',
      color: theme.text, 
      fontFamily: theme.fontFamily, 
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <div style={{ 
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px', 
        background: weightSettings.theme === 'serious' ? 'rgba(0,0,0,0.3)' : 'transparent' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>體重紀錄</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
             <button 
                onClick={() => setView(view === 'chart' ? 'calendar' : 'chart')}
                style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: theme.radius === '0px' ? '0' : '10px', padding: '8px', cursor: 'pointer' }}
                title={view === 'chart' ? '切換至日曆' : '切換至圖表'}
             >
                {view === 'chart' ? <Calendar size={18} /> : <BarChart3 size={18} />}
             </button>
             <button onClick={() => setShowGoalModal(true)} style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: theme.radius === '0px' ? '0' : '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                <Target size={16} /> 目標
             </button>
             <select 
               value={weightSettings.theme}
               onChange={(e) => setWeightSettings({ theme: e.target.value })}
               style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: theme.radius === '0px' ? '0' : '10px', padding: '6px', cursor: 'pointer', outline: 'none', fontWeight: 'bold', fontSize: '12px' }}
             >
               {Object.entries(themes).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
             </select>
        </div>
      </div>

      <div className="page-content" style={{ padding: '0 20px 40px' }}>
        
        <Card 
          onClick={() => openEditorForDate(getSafeDateString(new Date()))}
          style={{ textAlign: 'center', marginBottom: '20px', cursor: 'pointer' }}
        >
             <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>目前體重</div>
             <div style={{ fontSize: '42px', fontWeight: '900', color: theme.primary }}>
               {currentWeight || '--'} <span style={{ fontSize: '16px' }}>kg</span>
             </div>
             {bmi > 0 && (
               <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 10px', background: bmiInfo.color + '20', color: bmiInfo.color, borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                 BMI: {bmi} ({bmiInfo.label})
               </div>
             )}
        </Card>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '12px' }}>
            <Calendar size={18} color={theme.primary} />
            <span style={{ fontSize: '11px', opacity: 0.6 }}>連續紀錄</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.streak} 天</span>
          </Card>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '12px' }}>
            <TrendingUp size={18} color={theme.primary} />
            <span style={{ fontSize: '11px', opacity: 0.6 }}>本週減重</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.weeklyLoss} kg</span>
          </Card>
        </div>

        {/* View Switcher */}
        <AnimatePresence mode="wait">
          {view === 'chart' ? (
            <motion.div key="chart" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                {/* Recharts */}
                <Card style={{ padding: '20px 10px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 10px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={16} /> 趨勢分析
                        </h3>
                        <div style={{ display: 'flex', gap: '4px', background: theme.secondary, padding: '2px', borderRadius: '8px' }}>
                        {['7d', '30d', 'all'].map(r => (
                            <button 
                            key={r} onClick={() => setDateRange(r)}
                            style={{
                                padding: '4px 8px', fontSize: '11px', border: 'none', cursor: 'pointer',
                                background: dateRange === r ? theme.primary : 'transparent',
                                color: dateRange === r ? 'white' : theme.text,
                                borderRadius: '6px', fontWeight: 'bold'
                            }}
                            >{r === '7d' ? '7天' : r === '30d' ? '30天' : '全部'}</button>
                        ))}
                        </div>
                    </div>
                    <div style={{ height: '200px', width: '100%' }}>
                        {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={weightSettings.theme === 'serious' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="displayDate" stroke={theme.text} fontSize={9} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} stroke={theme.text} fontSize={9} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: theme.cardBg, borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: theme.text, fontSize: '12px' }} />
                                {targetWeight > 0 && <ReferenceLine y={targetWeight} stroke={theme.primary} strokeDasharray="5 5" label={{ value: '目標', position: 'right', fill: theme.primary, fontSize: 9 }} />}
                                <Line type="monotone" dataKey="weight" stroke={theme.chartLine} strokeWidth={2} dot={{ r: 3, fill: theme.chartLine }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                        ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>尚無數據</div>
                        )}
                    </div>
                </Card>
            </motion.div>
          ) : (
            <motion.div key="calendar" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                {/* Calendar Grid */}
                <Card style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ background: theme.secondary, border: 'none', color: theme.primary, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
                        <span style={{ fontWeight: 'bold' }}>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ background: theme.secondary, border: 'none', color: theme.primary, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {['日','一','二','三','四','五','六'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: '10px', opacity: 0.5, padding: '4px' }}>{d}</div>)}
                        {calendarDays.map((date, idx) => {
                            if (!date) return <div key={idx} />;
                            const dStr = getSafeDateString(date);
                            const entry = weightEntries.find(e => e.date === dStr);
                            const isToday = new Date().toDateString() === date.toDateString();
                            
                            return (
                                <div key={idx} onClick={() => openEditorForDate(dStr)} style={{ 
                                    aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                    background: isToday ? theme.primary : (entry ? theme.secondary : 'transparent'),
                                    color: isToday ? 'white' : (entry ? theme.primary : 'inherit'),
                                    borderRadius: theme.radius === '0px' ? '0' : '8px', cursor: 'pointer', fontSize: '12px', fontWeight: isToday || entry ? 'bold' : 'normal', position: 'relative'
                                }}>
                                    {date.getDate()}
                                    {entry && <div style={{ fontSize: '8px', position: 'absolute', bottom: '2px' }}>{entry.weight}</div>}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goal Indicator */}
        <Card style={{ borderLeft: `5px solid ${theme.primary}`, marginBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>目標進度</div>
                <Trophy size={16} color={theme.primary} />
            </div>
            {targetWeight > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>目標體重</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{targetWeight} kg</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>剩餘</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: theme.primary }}>{remainingKg} kg</div>
                    </div>
                    <div style={{ gridColumn: 'span 2', padding: '10px', background: theme.secondary, borderRadius: '10px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} /> 預計達成日：<strong style={{ color: theme.primary }}>{estCompletionDate}</strong>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '8px' }}>
                    <button onClick={() => setShowGoalModal(true)} style={{ background: theme.primary, color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>設定目標</button>
                </div>
            )}
        </Card>

      </div>

      {/* Goal Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <ModalWrapper theme={theme} onClose={() => setShowGoalModal(false)} title="身體數據設定">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>身高 (cm)</label>
                   <input 
                     type="number" step="0.1" value={weightGoal?.height || ''} 
                     onChange={e => setWeightGoal({ height: parseFloat(e.target.value) || 0 })}
                     placeholder="175"
                     style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${theme.primary}30`, background: theme.bg, color: theme.text, fontSize: '14px' }}
                   />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>目標體重 (kg)</label>
                   <input 
                     type="number" step="0.1" value={weightGoal?.targetWeight || ''} 
                     onChange={e => setWeightGoal({ targetWeight: parseFloat(e.target.value) || 0 })}
                     placeholder="65"
                     style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${theme.primary}30`, background: theme.bg, color: theme.text, fontSize: '14px' }}
                   />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>每週減重速 (kg/週)</label>
                   <input 
                     type="number" step="0.01" value={weightGoal?.weeklyLossGoal === 0 ? '' : weightGoal.weeklyLossGoal} 
                     onChange={e => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setWeightGoal({ weeklyLossGoal: val });
                     }}
                     placeholder="0.5"
                     style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${theme.primary}30`, background: theme.bg, color: theme.text, fontSize: '14px' }}
                   />
                </div>
                <button onClick={() => setShowGoalModal(false)} style={{ width: '100%', padding: '12px', background: theme.primary, color: 'white', border: 'none', borderRadius: theme.radius, fontWeight: 'bold', cursor: 'pointer' }}>完成設定</button>
             </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <ModalWrapper theme={theme} onClose={() => setShowAddModal(false)} title="紀錄體重">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>日期</label>
                   <input 
                     type="date" value={editingEntry?.date || ''} 
                     onChange={e => {
                        const newD = e.target.value;
                        const existing = weightEntries.find(we => we.date === newD);
                        setEditingEntry({ date: newD, weight: existing ? existing.weight : (editingEntry?.weight || currentWeight || 0) });
                     }}
                     style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${theme.primary}30`, background: theme.bg, color: theme.text, fontSize: '14px' }}
                   />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>體重 (kg)</label>
                   <div style={{ position: 'relative' }}>
                     <input 
                        type="number" step="0.1" autoFocus
                        value={editingEntry?.weight === 0 && !editingEntry?.isNew ? '' : editingEntry?.weight} 
                        onChange={e => setEditingEntry({ ...editingEntry, weight: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: `2px solid ${theme.primary}`, background: theme.bg, color: theme.text, fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}
                     />
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => {
                            if (editingEntry?.weight > 0 && editingEntry?.date) {
                                addWeightEntry({ weight: editingEntry.weight, date: editingEntry.date });
                                setShowAddModal(false);
                            }
                        }}
                        style={{ flex: 1, padding: '12px', background: theme.primary, color: 'white', border: 'none', borderRadius: theme.radius, fontWeight: 'bold', cursor: 'pointer' }}
                    >儲存數據</button>
                    {weightEntries.find(we => we.date === editingEntry?.date) && (
                        <button 
                            onClick={() => {
                                const ent = weightEntries.find(we => we.date === editingEntry.date);
                                if (ent && window.confirm('確定刪除此筆紀錄？')) {
                                    deleteWeightEntry(ent.id);
                                    setShowAddModal(false);
                                }
                            }}
                            style={{ padding: '12px', color: '#ef4444', background: 'transparent', border: '1px solid #ef4444', borderRadius: theme.radius, cursor: 'pointer' }}
                        ><Trash2 size={22} /></button>
                    )}
                </div>
             </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

    </div>
  );
}

function ModalWrapper({ children, onClose, title, theme }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
       <motion.div 
         initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
         style={{ background: theme.cardBg, width: '100%', maxWidth: '360px', borderRadius: theme.radius, padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', color: theme.text }}
       >
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold' }}>{title}</h3>
            <button onClick={onClose} style={{ background: theme.secondary, border: 'none', color: theme.primary, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <X size={16} />
            </button>
         </div>
         {children}
       </motion.div>
    </div>
  );
}
