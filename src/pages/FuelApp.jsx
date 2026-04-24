import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, Plus, Car, Bike, Fuel as FuelIcon, 
  Calendar, DollarSign, Activity, Edit2, X, Settings,
  ChevronLeft, ChevronRight, Check, ChevronDown, Wrench, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function FuelApp() {
  const navigate = useNavigate();
  const { 
    vehicles, fuelLogs, addVehicle, addFuelLog, updateFuelLog, deleteFuelLog,
    fuelSettings, setFuelSettings 
  } = useStore();
  
  const theme = themes[fuelSettings?.theme] || themes.forest;
  
  const [activeVehicleId, setActiveVehicleId] = useState(vehicles.length > 0 ? vehicles[0].id : null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', type: 'car' });
  const [editingLogId, setEditingLogId] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    price: '',
    mileage: '',
    type: 'fuel', // 'fuel' or 'maintenance'
    note: ''
  });

  const [viewTab, setViewTab] = useState('fuel'); // 'fuel' or 'maintenance'

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const appStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (newVehicle.name) {
      addVehicle(newVehicle);
      setNewVehicle({ name: '', type: 'car' });
      setShowAddVehicle(false);
    }
  };

  const handleSubmitLog = (e) => {
    e.preventDefault();
    const isFuel = formData.type === 'fuel';
    const isValid = isFuel 
      ? (activeVehicleId && formData.amount && formData.price && formData.mileage)
      : (activeVehicleId && formData.amount && formData.mileage && formData.note);

    if (isValid) {
      const payload = {
        vehicleId: activeVehicleId,
        date: formData.date,
        type: formData.type,
        amount: parseFloat(formData.amount),
        mileage: parseFloat(formData.mileage),
        ...(isFuel ? { price: parseFloat(formData.price) } : { note: formData.note })
      };
      if (editingLogId) {
        updateFuelLog(editingLogId, payload);
        setEditingLogId(null);
      } else {
        addFuelLog(payload);
      }
      setFormData({ 
        date: new Date().toISOString().slice(0, 10), 
        amount: '', 
        price: '', 
        mileage: '',
        type: 'fuel',
        note: ''
      });
    }
  };
  
  const handleEditClick = (log) => {
    setEditingLogId(log.id);
    setFormData({
      date: log.date,
      amount: log.amount.toString(),
      price: log.price?.toString() || '',
      mileage: log.mileage.toString(),
      type: log.type || 'fuel',
      note: log.note || ''
    });
    document.querySelector('.page-content').scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setFormData({ 
      date: new Date().toISOString().slice(0, 10), 
      amount: '', 
      price: '', 
      mileage: '',
      type: 'fuel',
      note: ''
    });
  };

  const currentLogs = fuelLogs
    .filter(log => {
      const logDate = new Date(log.date);
      const isCorrectType = viewTab === 'fuel' 
        ? (!log.type || log.type === 'fuel') // Compatibility with old logs
        : (log.type === 'maintenance');

      return log.vehicleId === activeVehicleId && 
             logDate.getMonth() === selectedMonth.getMonth() && 
             logDate.getFullYear() === selectedMonth.getFullYear() &&
             isCorrectType;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const chartData = fuelLogs
    .filter(log => {
      const logDate = new Date(log.date);
      return log.vehicleId === activeVehicleId && 
             logDate.getFullYear() === selectedYear &&
             (!log.type || log.type === 'fuel'); // Only chart fuel prices
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(log => ({
      date: log.date.slice(5),
      price: log.price
    }));

  const changeMonth = (offset) => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + offset);
    setSelectedMonth(next);
  };

  const changeYear = (offset) => {
    setSelectedYear(prev => prev + offset);
  };

  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getLogOnDay = (day) => {
    if (!day) return null;
    const dateStr = `${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const logsOnDay = fuelLogs.filter(log => log.vehicleId === activeVehicleId && log.date === dateStr);
    if (logsOnDay.length === 0) return null;
    
    const hasMaintenance = logsOnDay.some(l => l.type === 'maintenance');
    const hasFuel = logsOnDay.some(l => !l.type || l.type === 'fuel');
    
    if (hasMaintenance && hasFuel) return 'both';
    return hasMaintenance ? 'maintenance' : 'fuel';
  };

  React.useEffect(() => {
    if ((!activeVehicleId || !vehicles.find(v => v.id === activeVehicleId)) && vehicles.length > 0) {
      setActiveVehicleId(vehicles[0].id);
    }
  }, [vehicles, activeVehicleId]);

  // Reset form when switching vehicles
  React.useEffect(() => {
    handleCancelEdit();
  }, [activeVehicleId]);

  return (
    <div style={appStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>加油紀錄表</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowAddVehicle(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={18} />
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Vehicle Tab Switcher (Top Nav Style) */}
      <div style={{ padding: '12px 16px', background: theme.cardBg, boxShadow: theme.shadow, borderBottom: theme.border }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {vehicles.map(v => (
            <div 
              key={v.id}
              onClick={() => setActiveVehicleId(v.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                borderRadius: '20px', whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeVehicleId === v.id ? theme.primary : theme.secondary,
                color: activeVehicleId === v.id ? 'white' : theme.text,
                fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'
              }}
            >
              {v.type === 'car' ? <Car size={16} /> : <Bike size={16} />}
              <span>{v.name}</span>
            </div>
          ))}
          {vehicles.length === 0 && <span style={{ opacity: 0.5 }}>點擊 + 新增交通工具</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeVehicleId ? (
          <>
            {/* New Record Form (Image-inspired UI) */}
            <div style={{ background: theme.cardBg, padding: '24px', borderRadius: theme.radius, boxShadow: theme.shadow, border: editingLogId ? '2px solid ' + theme.primary : theme.border, marginBottom: '24px' }}>
              {/* Card Header with Toggles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: theme.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px ' + theme.primary + '33' }}>
                    {formData.type === 'fuel' ? <FuelIcon size={20} /> : <Wrench size={20} />}
                  </div>
                  <h2 style={{ fontWeight: 'bold', fontSize: '18px', letterSpacing: '0.5px' }}>{editingLogId ? '編輯紀錄' : '新增紀錄'}</h2>
                </div>
                
                <div style={{ display: 'flex', background: theme.secondary + '44', borderRadius: '10px', padding: '3px' }}>
                  <button 
                    onClick={() => setFormData({ ...formData, type: 'fuel' })}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: formData.type === 'fuel' ? theme.primary : 'transparent', color: formData.type === 'fuel' ? 'white' : theme.text, fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
                  >
                    <FuelIcon size={12} /> 加油
                  </button>
                  <button 
                    onClick={() => setFormData({ ...formData, type: 'maintenance' })}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: formData.type === 'maintenance' ? theme.primary : 'transparent', color: formData.type === 'maintenance' ? 'white' : theme.text, fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
                  >
                    <Wrench size={12} /> 保養
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.6 }}>日期</label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.secondary + '22', color: 'inherit', fontSize: '13px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>總里程 (km)</label>
                  <input type="number" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.secondary + '22', color: 'inherit', fontSize: '13px' }} placeholder="請輸入里程" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>金額</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.secondary + '22', color: 'inherit', fontSize: '13px' }} placeholder="0" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {formData.type === 'fuel' ? (
                    <>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>單價/公升</label>
                      <input type="number" step="0.1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.secondary + '22', color: 'inherit', fontSize: '13px' }} placeholder="0.0" />
                    </>
                  ) : (
                    <>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>保養內容</label>
                      <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.secondary + '22', color: 'inherit', fontSize: '13px' }} placeholder="內容描述" />
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {editingLogId && (
                  <button onClick={handleCancelEdit} style={{ flex: 0.4, padding: '12px', borderRadius: '12px', background: theme.secondary, color: theme.text, border: 'none', fontWeight: 'bold', fontSize: '14px' }}>取消</button>
                )}
                <button onClick={handleSubmitLog} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 5px 15px ' + theme.primary + '33' }}>
                  <Check size={18} />
                  {editingLogId ? '更新紀錄' : '確認儲存'}
                </button>
              </div>
            </div>

            {/* Monthly Calendar */}
            <div style={{ background: theme.cardBg, padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedMonth.getFullYear()}年 {selectedMonth.getMonth() + 1}月
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => changeMonth(-1)} style={{ padding: '4px', background: theme.secondary, border: 'none', borderRadius: '50%', color: theme.text, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
                  <button onClick={() => setSelectedMonth(new Date())} style={{ padding: '4px 12px', background: theme.secondary, border: 'none', borderRadius: '12px', fontSize: '12px', color: theme.text, cursor: 'pointer' }}>本月</button>
                  <button onClick={() => changeMonth(1)} style={{ padding: '4px', background: theme.secondary, border: 'none', borderRadius: '50%', color: theme.text, cursor: 'pointer' }}><ChevronRight size={18} /></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} style={{ opacity: 0.5 }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {getCalendarDays().map((day, i) => {
                  const logType = getLogOnDay(day);
                  const isToday = day && new Date().getFullYear() === selectedMonth.getFullYear() && new Date().getMonth() === selectedMonth.getMonth() && new Date().getDate() === day;
                  
                  const getDotColor = () => {
                    if (logType === 'both') return theme.primary;
                    if (logType === 'maintenance') return '#f59e0b'; // Amber/Orange for maintenance
                    return theme.primary;
                  };

                  return (
                    <div 
                      key={i} 
                      style={{ 
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        borderRadius: '8px', fontSize: '13px', position: 'relative',
                        background: isToday ? theme.primary + '22' : 'transparent',
                        color: day ? theme.text : 'transparent',
                        border: isToday ? `1px solid ${theme.primary}` : 'none'
                      }}
                    >
                      {day}
                      {logType && (
                        <div style={{ 
                          position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', 
                          background: getDotColor(),
                          boxShadow: logType === 'both' ? `2px 0 0 #f59e0b` : 'none',
                          transform: logType === 'both' ? 'translateX(-1px)' : 'none'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', opacity: 0.9 }}>歷史明細</h2>
                <div style={{ display: 'flex', background: theme.secondary, borderRadius: '10px', padding: '2px' }}>
                  <button 
                    onClick={() => setViewTab('fuel')}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewTab === 'fuel' ? theme.cardBg : 'transparent', color: theme.text, fontSize: '12px', fontWeight: 'bold', boxShadow: viewTab === 'fuel' ? theme.shadow : 'none', transition: 'all 0.2s' }}
                  >
                    油耗
                  </button>
                  <button 
                    onClick={() => setViewTab('maintenance')}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: viewTab === 'maintenance' ? theme.cardBg : 'transparent', color: theme.text, fontSize: '12px', fontWeight: 'bold', boxShadow: viewTab === 'maintenance' ? theme.shadow : 'none', transition: 'all 0.2s' }}
                  >
                    保養
                  </button>
                </div>
              </div>

              {currentLogs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentLogs.map(log => (
                    <div key={log.id} onClick={() => handleEditClick(log)} style={{ background: theme.cardBg, padding: '16px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: viewTab === 'fuel' ? theme.primary + '15' : '#f59e0b15', color: viewTab === 'fuel' ? theme.primary : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {viewTab === 'fuel' ? <FuelIcon size={20} /> : <Wrench size={20} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{log.date}</div>
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>
                            里程: {log.mileage} km 
                            {viewTab === 'maintenance' && log.note && ` • ${log.note.slice(0, 15)}${log.note.length > 15 ? '...' : ''}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: viewTab === 'fuel' ? theme.primary : '#f59e0b' }}>${log.amount}</div>
                        <div style={{ fontSize: '12px', opacity: 0.6 }}>
                          {viewTab === 'fuel' ? `${log.price}/L` : '保養支出'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: theme.cardBg, borderRadius: theme.radius, opacity: 0.5, border: theme.border }}>
                  <Receipt size={32} style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '14px' }}>本月尚無{viewTab === 'fuel' ? '加油' : '保養'}紀錄</p>
                </div>
              )}
            </div>

            {chartData.length > 0 && (
              <div style={{ background: theme.cardBg, padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>油價走勢</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => changeYear(-1)} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', opacity: 0.5 }}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{selectedYear}</span>
                    <button onClick={() => changeYear(1)} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', opacity: 0.5 }}><ChevronRight size={16} /></button>
                  </div>
                </div>
                {isMounted && chartData.length > 1 ? (
                  <div style={{ width: '100%', height: '220px', marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.secondary} vertical={false} />
                        <XAxis dataKey="date" stroke={theme.text} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme.text} fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ background: theme.cardBg, border: theme.border, borderRadius: '8px', color: theme.text }} />
                        <Line type="monotone" dataKey="price" stroke={theme.primary} strokeWidth={3} dot={{ r: 4, fill: theme.primary }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '14px' }}>
                    該年度紀錄不足，無法顯示走勢
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '60px', opacity: 0.5 }}>
            <Activity size={64} style={{ marginBottom: '16px' }} />
            <p>尚未建立交通工具檔案</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>加油紀錄設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(themes).map(([key, t]) => (
                <button key={key} onClick={() => setFuelSettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: fuelSettings?.theme === key ? theme.primary : theme.secondary, color: fuelSettings?.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '340px', padding: '24px', borderRadius: theme.radius, border: theme.border }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>新增交通工具</h2>
             <form onSubmit={handleAddVehicle}>
               <div style={{ marginBottom: '16px' }}>
                 <label style={{ fontSize: '12px', opacity: 0.7 }}>名稱</label>
                 <input style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit' }} required placeholder="例如: 小藍車" value={newVehicle.name} onChange={e => setNewVehicle({...newVehicle, name: e.target.value})} />
               </div>
               <div style={{ marginBottom: '24px' }}>
                 <label style={{ fontSize: '12px', opacity: 0.7 }}>種類</label>
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <div onClick={() => setNewVehicle({...newVehicle, type: 'car'})} style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '8px', border: `1px solid ${newVehicle.type === 'car' ? theme.primary : theme.secondary}`, background: newVehicle.type === 'car' ? theme.primary : 'transparent', color: newVehicle.type === 'car' ? 'white' : 'inherit', cursor: 'pointer' }}>汽車</div>
                   <div onClick={() => setNewVehicle({...newVehicle, type: 'motorcycle'})} style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '8px', border: `1px solid ${newVehicle.type === 'motorcycle' ? theme.primary : theme.secondary}`, background: newVehicle.type === 'motorcycle' ? theme.primary : 'transparent', color: newVehicle.type === 'motorcycle' ? 'white' : 'inherit', cursor: 'pointer' }}>機車</div>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" onClick={() => setShowAddVehicle(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: theme.secondary, color: theme.text }}>取消</button>
                 <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: 'bold' }}>新增</button>
               </div>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
