import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Settings, X, Plus, 
  Trash2, CalendarHeart, RefreshCw, Phone
} from 'lucide-react';
import { useStore } from '../store/useStore';

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

// === Settings Modal (Manage Staff & Shift Types) ===
function SettingsModal({ onClose, theme }) {
  const { 
    shiftStaff, shiftTypes, addShiftStaff, updateShiftStaff, deleteShiftStaff, 
    addShiftType, updateShiftType, deleteShiftType, shiftSettings, setShiftSettings 
  } = useStore();
  
  const [tab, setTab] = useState('staff'); // 'staff' | 'shifts' | 'theme'
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState(null);

  const handleAddOrUpdate = () => {
    if (!newName.trim()) return;
    if (tab === 'staff') {
      if (editingId) {
        updateShiftStaff(editingId, { name: newName.trim(), phone: newPhone.trim(), color: newColor });
      } else {
        addShiftStaff({ name: newName.trim(), phone: newPhone.trim(), color: newColor });
      }
    } else {
      if (editingId) {
        updateShiftType(editingId, { name: newName.trim(), color: newColor });
      } else {
        addShiftType({ name: newName.trim(), color: newColor });
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewPhone('');
    setNewColor('#3b82f6');
    setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setNewName(item.name);
    setNewPhone(item.phone || '');
    setNewColor(item.color);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: theme.cardBg, width: '90%', maxWidth: '400px', borderRadius: theme.radius, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh', border: theme.border, boxShadow: theme.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${theme.secondary}` }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text }}>排班設定</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text }}><X size={20} /></button>
        </div>
        
        <div style={{ display: 'flex', borderBottom: `1px solid ${theme.secondary}` }}>
          <button onClick={() => { setTab('staff'); resetForm(); }} style={{ flex: 1, padding: '12px', background: tab === 'staff' ? theme.secondary : 'transparent', border: 'none', fontWeight: 'bold', color: theme.text }}>人員</button>
          <button onClick={() => { setTab('shifts'); resetForm(); }} style={{ flex: 1, padding: '12px', background: tab === 'shifts' ? theme.secondary : 'transparent', border: 'none', fontWeight: 'bold', color: theme.text }}>班別</button>
          <button onClick={() => { setTab('theme'); resetForm(); }} style={{ flex: 1, padding: '12px', background: tab === 'theme' ? theme.secondary : 'transparent', border: 'none', fontWeight: 'bold', color: theme.text }}>主題</button>
        </div>

        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          {tab === 'theme' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Object.entries(themes).map(([key, t]) => (
                <button 
                  key={key} 
                  onClick={() => setShiftSettings({ theme: key })}
                  style={{ 
                    padding: '12px', borderRadius: theme.radius, border: shiftSettings?.theme === key ? `2px solid ${theme.primary}` : `1px solid ${theme.secondary}`,
                    background: t.bg, color: t.text, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="color" 
                    value={newColor} 
                    onChange={e => setNewColor(e.target.value)} 
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    placeholder={`${editingId ? '修改' : '新增'}${tab === 'staff' ? '人員' : '班別'}名稱...`}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{ flex: 1, border: `1px solid ${theme.secondary}`, borderRadius: '8px', padding: '0 12px', color: theme.text, background: theme.bg, fontSize: '15px' }}
                  />
                </div>
                {tab === 'staff' && (
                  <input 
                    type="tel" 
                    placeholder="輸入電話號碼 (選填)..."
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    style={{ border: `1px solid ${theme.secondary}`, borderRadius: '8px', padding: '10px 12px', color: theme.text, background: theme.bg, fontSize: '15px' }}
                  />
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editingId && (
                    <button onClick={resetForm} style={{ flex: 1, padding: '10px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>取消</button>
                  )}
                  <button onClick={handleAddOrUpdate} style={{ flex: 2, padding: '10px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {editingId ? <RefreshCw size={18} /> : <Plus size={18} />}
                    {editingId ? '確認修改' : '新增'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(tab === 'staff' ? shiftStaff : shiftTypes).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.secondary}` }}>
                    <div onClick={() => startEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: item.color }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold', color: theme.text }}>{item.name}</span>
                        {item.phone && <span style={{ fontSize: '12px', opacity: 0.6, color: theme.text }}>{item.phone}</span>}
                      </div>
                    </div>
                    <button onClick={() => tab === 'staff' ? deleteShiftStaff(item.id) : deleteShiftType(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {(tab === 'staff' ? shiftStaff : shiftTypes).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: theme.text, opacity: 0.5 }}>目前無資料</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// === Day Editor Modal ===
function DayEditorModal({ date, onClose, currentData, theme }) {
  const { shiftStaff, shiftTypes, setShiftSchedule, batchSetShiftSchedules } = useStore();
  const dateStr = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  
  const [assignments, setAssignments] = useState(() => {
    const state = {};
    shiftTypes.forEach(st => state[st.id] = []);
    if (currentData) {
      currentData.forEach(sd => {
        state[sd.shiftId] = sd.staffIds || [];
      });
    }
    return state;
  });

  const [applyWholeWeek, setApplyWholeWeek] = useState(false);
  const [applyWholeMonth, setApplyWholeMonth] = useState(false);

  const isMonday = date.getDay() === 1;
  const isFirstOfMonth = date.getDate() === 1;

  const toggleStaff = (shiftId, staffId) => {
    setAssignments(prev => {
      const current = prev[shiftId] || [];
      const isSelected = current.includes(staffId);
      return {
        ...prev,
        [shiftId]: isSelected ? current.filter(id => id !== staffId) : [...current, staffId]
      };
    });
  };

  const handleSave = () => {
    const formatted = Object.entries(assignments)
      .filter(([_, staffIds]) => staffIds.length > 0)
      .map(([shiftId, staffIds]) => ({ shiftId, staffIds }));

    if (applyWholeMonth) {
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const updates = {};
      for (let i = 1; i <= daysInMonth; i++) {
        const dStr = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(i).padStart(2, '0')].join('-');
        updates[dStr] = formatted;
      }
      batchSetShiftSchedules(updates);
    } 
    else if (applyWholeWeek) {
      const updates = {};
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(date);
        targetDate.setDate(date.getDate() + i);
        const dStr = [targetDate.getFullYear(), String(targetDate.getMonth() + 1).padStart(2, '0'), String(targetDate.getDate()).padStart(2, '0')].join('-');
        updates[dStr] = formatted;
      }
      batchSetShiftSchedules(updates);
    } 
    else {
      setShiftSchedule(dateStr, formatted);
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: theme.cardBg, width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 -8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: theme.text }}>編輯排班</h3>
            <p style={{ color: theme.text, opacity: 0.6, fontSize: '14px', marginTop: '4px' }}>{date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日 (週{['日','一','二','三','四','五','六'][date.getDay()]})</p>
          </div>
          <button onClick={onClose} style={{ background: theme.secondary, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {shiftTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.text, opacity: 0.5 }}>請先至右上角設定新增「班別」與「人員」</div>
          ) : shiftTypes.map(st => (
            <div key={st.id} style={{ border: `1px solid ${theme.secondary}`, borderRadius: '12px', overflow: 'hidden', background: theme.bg }}>
              <div style={{ background: theme.secondary, padding: '12px 16px', fontWeight: 'bold', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: st.color }} />
                {st.name}
              </div>
              <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {shiftStaff.map(staff => {
                  const isSelected = assignments[st.id]?.includes(staff.id);
                  return (
                    <div 
                      key={staff.id} 
                      onClick={() => toggleStaff(st.id, staff.id)}
                      style={{ 
                        padding: '6px 14px', borderRadius: '20px', fontSize: '14px', cursor: 'pointer',
                        background: isSelected ? staff.color : 'transparent',
                        color: isSelected ? 'white' : theme.text,
                        border: `1px solid ${isSelected ? staff.color : theme.secondary}`,
                        transition: 'all 0.2s', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <div style={{ width: '14px', height: '14px', borderRadius: '5px', border: isSelected ? '1px solid white' : `1px solid ${theme.text}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'white' : 'transparent' }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', background: staff.color, borderRadius: '2px' }} />}
                      </div>
                      {staff.name}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isMonday && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: theme.secondary, padding: '12px', borderRadius: '12px', color: theme.text, fontWeight: 'bold' }}>
              <input type="checkbox" checked={applyWholeWeek} onChange={e => { setApplyWholeWeek(e.target.checked); if(e.target.checked) setApplyWholeMonth(false); }} style={{ width: '18px', height: '18px' }} />
              套用至本週整週
            </label>
          )}
          {isFirstOfMonth && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: theme.secondary, padding: '12px', borderRadius: '12px', color: theme.text, fontWeight: 'bold' }}>
              <input type="checkbox" checked={applyWholeMonth} onChange={e => { setApplyWholeMonth(e.target.checked); if(e.target.checked) setApplyWholeWeek(false); }} style={{ width: '18px', height: '18px' }} />
              套用至整個月份
            </label>
          )}
          <button onClick={handleSave} style={{ width: '100%', padding: '16px', background: theme.primary, color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold' }}>
            儲存排班
          </button>
        </div>
      </div>
    </div>
  );
}

// === Main Application ===
export default function ShiftApp() {
  const navigate = useNavigate();
  const { shiftStaff, shiftTypes, shiftSchedules, shiftSettings } = useStore();
  const theme = themes[shiftSettings?.theme] || themes.forest;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [editingDate, setEditingDate] = useState(null);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayObj = new Date(year, month, 1);
    let startingOffset = (firstDayObj.getDay() + 6) % 7; 
    const days = [];
    for (let i = 0; i < startingOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentDate]);

  const getDayData = (dateObj) => {
    if (!dateObj) return null;
    const dateStr = [dateObj.getFullYear(), String(dateObj.getMonth() + 1).padStart(2, '0'), String(dateObj.getDate()).padStart(2, '0')].join('-');
    return shiftSchedules[dateStr] || [];
  };

  const todayDateObj = new Date();
  const todayData = getDayData(todayDateObj);

  return (
    <div style={{ background: theme.bg, color: theme.text, height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      <div className="app-header" style={{ background: theme.primary, color: 'white', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: theme.shadow }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ flex: 1, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>排班管理</h1>
        <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.cardBg, borderTopLeftRadius: theme.radius, borderTopRightRadius: theme.radius, marginTop: '-12px', zIndex: 10, padding: '24px 16px 120px 16px', overflowY: 'auto', border: theme.border }}>
        
        {/* Today's Shift Overview */}
        <div style={{ marginBottom: '24px', padding: '20px', background: theme.bg, borderRadius: theme.radius, border: `1px solid ${theme.secondary}`, boxShadow: theme.shadow }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: theme.primary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarHeart size={20} />
            今日值班 ({todayDateObj.getMonth() + 1}月{todayDateObj.getDate()}日)
          </h3>
          {(!todayData || todayData.length === 0) ? (
            <div style={{ fontSize: '14px', opacity: 0.5 }}>今日尚無排班紀錄。</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayData.map((shift, idx) => {
                const st = shiftTypes.find(t => t.id === shift.shiftId);
                if (!st) return null;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: theme.cardBg, padding: '12px', borderRadius: '12px', border: `1px solid ${theme.secondary}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: st.color, fontWeight: 'bold', fontSize: '14px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: st.color }} />
                      {st.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {shift.staffIds.map(sid => {
                        const staff = shiftStaff.find(s => s.id === sid);
                        if (!staff) return null;
                        return (
                          <div key={sid} style={{ background: staff.color, color: 'white', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{staff.name}</span>
                              {staff.phone && (
                                <a href={`tel:${staff.phone}`} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Phone size={10} /> {staff.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 8px' }}>
          <button onClick={prevMonth} style={{ background: theme.secondary, border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text }}><ChevronLeft size={24} /></button>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: theme.text }}>{currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月</h2>
          <button onClick={nextMonth} style={{ background: theme.secondary, border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text }}><ChevronRight size={24} /></button>
        </div>

        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', marginBottom: '8px' }}>
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: 'min(12px, 3vw)', fontWeight: 'bold', color: theme.text, opacity: 0.6, padding: '4px 0' }}>{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', autoRows: 'minmax(80px, auto)', gap: '4px' }}>
          {calendarDays.map((dateObj, i) => {
            if (!dateObj) return <div key={i} style={{ background: theme.bg, opacity: 0.1, borderRadius: '8px' }} />;
            const dayData = getDayData(dateObj);
            const isToday = new Date().toDateString() === dateObj.toDateString();

            return (
              <div key={i} onClick={() => setEditingDate(dateObj)} style={{ background: isToday ? theme.secondary : theme.bg, border: isToday ? `2px solid ${theme.primary}` : `1px solid ${theme.secondary}`, borderRadius: '8px', padding: '4px 2px', display: 'flex', flexDirection: 'column', cursor: 'pointer', minHeight: '80px', transition: 'all 0.2s', overflow: 'hidden' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: isToday ? theme.primary : theme.text, opacity: isToday ? 1 : 0.7, alignSelf: 'flex-end', marginBottom: '2px', marginRight: '2px' }}>{dateObj.getDate()}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  {dayData.map((shift, idx) => {
                    const st = shiftTypes.find(t => t.id === shift.shiftId);
                    if (!st) return null;
                    return (
                      <div key={idx} style={{ padding: '1px 2px', background: st.color + '20', borderLeft: `2px solid ${st.color}`, borderRadius: '0 2px 2px 0' }}>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: st.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', marginTop: '1px' }}>
                          {shift.staffIds.map(sid => {
                            const staff = shiftStaff.find(s => s.id === sid);
                            if (!staff) return null;
                            return <span key={sid} style={{ fontSize: '8px', background: staff.color, color: 'white', padding: '0px 2px', borderRadius: '2px', whiteSpace: 'nowrap' }}>{staff.name}</span>;
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} theme={theme} />}
      {editingDate && <DayEditorModal date={editingDate} onClose={() => setEditingDate(null)} currentData={getDayData(editingDate)} theme={theme} />}
      
      <style>{`
        .app-header { transition: background 0.3s ease; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); borderRadius: 10px; }
      `}</style>
    </div>
  );
}
