import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, Plus, CreditCard, DollarSign, PieChart, X, Activity, Settings 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function CreditApp() {
  const navigate = useNavigate();
  const { 
    cards, cardBills, addCard, addCardBill, updateCardBill,
    creditSettings, setCreditSettings 
  } = useStore();
  
  const theme = themes[creditSettings?.theme] || themes.forest;
  
  const [activeCardId, setActiveCardId] = useState(cards.length > 0 ? cards[0].id : null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newCard, setNewCard] = useState({ name: '', number: '' });
  const [editingBillId, setEditingBillId] = useState(null);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    amount: ''
  });

  const appStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (newCard.name && cards.length < 6) {
      addCard({ name: newCard.name, number: newCard.number });
      setNewCard({ name: '', number: '' });
      setShowAddCard(false);
    }
  };

  const handleSubmitBill = (e) => {
    e.preventDefault();
    if (activeCardId && formData.amount) {
      const year = parseInt(formData.year);
      const month = parseInt(formData.month);
      const amount = parseFloat(formData.amount);
      if (editingBillId) {
        updateCardBill(editingBillId, { year, month, amount });
        setEditingBillId(null);
      } else {
        const existing = cardBills.find(b => b.cardId === activeCardId && b.year === year && b.month === month);
        if (existing) updateCardBill(existing.id, { amount });
        else addCardBill({ cardId: activeCardId, year, month, amount });
      }
      setFormData({ ...formData, amount: '' });
    }
  };

  const handleBarClick = (data) => {
    const clickedMonth = parseInt(data.month.replace('月',''));
    const clickedYear = parseInt(formData.year);
    const existingBill = currentBills.find(b => b.month === clickedMonth);
    if (existingBill) {
      setEditingBillId(existingBill.id);
      setFormData({ year: existingBill.year.toString(), month: existingBill.month.toString(), amount: existingBill.amount.toString() });
    } else {
      setEditingBillId(null);
      setFormData({ year: clickedYear.toString(), month: clickedMonth.toString(), amount: '' });
    }
    document.querySelector('.page-content').scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBillId(null);
    setFormData({ ...formData, amount: '' });
  };

  const activeCard = cards.find(c => c.id === activeCardId);
  const currentBills = cardBills.filter(b => b.cardId === activeCardId && b.year === parseInt(formData.year));
  const yearlyTotal = currentBills.reduce((sum, b) => sum + b.amount, 0);
  
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const bill = currentBills.find(b => b.month === month);
    return { month: `${month}月`, amount: bill ? bill.amount : 0 };
  });

  const cardColors = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

  return (
    <div style={appStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>信用卡費</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/credit/analysis')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart size={18} />
          </button>
          <button onClick={() => setShowAddCard(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} />
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Card List (Top Nav Style) */}
      <div style={{ padding: '16px 20px', background: theme.cardBg, boxShadow: theme.shadow, borderBottom: theme.border, zIndex: 10 }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {cards.map((card, idx) => {
            const color = cardColors[idx % cardColors.length];
            const isActive = activeCardId === card.id;
            return (
              <div 
                key={card.id}
                onClick={() => setActiveCardId(card.id)}
                style={{
                  minWidth: '130px', height: '74px', borderRadius: '12px', padding: '10px',
                  background: isActive ? `linear-gradient(135deg, ${color}cc, ${color})` : theme.secondary,
                  border: isActive ? `2px solid #ffffff` : theme.border || '1px solid transparent',
                  color: isActive ? 'white' : theme.text,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isActive ? `0 4px 10px ${color}40` : 'none',
                  opacity: isActive ? 1 : 0.7
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{card.name}</div>
                <div style={{ fontSize: '11px', alignSelf: 'flex-end', letterSpacing: '1px', opacity: 0.8 }}>
                  {card.number ? `**** ${card.number.slice(-4)}` : '****'}
                </div>
              </div>
            );
          })}
          {cards.length < 6 && (
            <div onClick={() => setShowAddCard(true)} style={{ minWidth: '130px', height: '74px', borderRadius: '12px', border: '1px dashed ' + theme.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, cursor: 'pointer' }}>
              <Plus size={20} />
              <div style={{ fontSize: '11px' }}>加卡</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeCard ? (
          <>
            <div style={{ background: theme.cardBg, padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: editingBillId ? '2px solid ' + theme.primary : theme.border, marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontWeight: 'bold' }}>{editingBillId ? '編輯帳單' : '本期帳單'}</h2>
                {editingBillId && <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.5 }}><X size={18} /></button>}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit' }} value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} disabled={editingBillId}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y} 年</option>)}
                </select>
                <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit' }} value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} disabled={editingBillId}>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m} 月</option>)}
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '13px', opacity: 0.5 }} />
                <input type="number" placeholder="請輸入金額" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', fontSize: '16px' }} />
              </div>
              <button onClick={handleSubmitBill} style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold' }}>
                {editingBillId ? '更新帳單' : '儲存紀錄'}
              </button>
            </div>

            <div style={{ background: theme.cardBg, padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>年度趨勢</h2>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>總計</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.primary }}>${yearlyTotal.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ width: '100%', height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="month" stroke={theme.text} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: theme.secondary, opacity: 0.4 }} contentStyle={{ background: theme.cardBg, border: theme.border, borderRadius: '8px', color: theme.text }} />
                    <Bar dataKey="amount" fill={theme.primary} radius={[4, 4, 0, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '60px', opacity: 0.5 }}>
            <Activity size={64} style={{ marginBottom: '16px' }} />
            <p>尚無信用卡資料</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>信用卡設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(themes).map(([key, t]) => (
                <button key={key} onClick={() => setCreditSettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: creditSettings?.theme === key ? theme.primary : theme.secondary, color: creditSettings?.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '340px', padding: '24px', borderRadius: theme.radius, border: theme.border }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>新增信用卡</h2>
             <form onSubmit={handleAddCard}>
               <div style={{ marginBottom: '16px' }}>
                 <label style={{ fontSize: '12px', opacity: 0.7 }}>卡片名稱</label>
                 <input style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit' }} required placeholder="例如: 台新 GoGo 卡" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} />
               </div>
               <div style={{ marginBottom: '24px' }}>
                 <label style={{ fontSize: '12px', opacity: 0.7 }}>銀行號碼 (末四碼)</label>
                 <input style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit' }} maxLength="4" placeholder="1234" value={newCard.number} onChange={e => setNewCard({...newCard, number: e.target.value.replace(/\D/g, '')})} />
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" onClick={() => setShowAddCard(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: theme.secondary, color: theme.text }}>取消</button>
                 <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: 'bold' }}>新增</button>
               </div>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
