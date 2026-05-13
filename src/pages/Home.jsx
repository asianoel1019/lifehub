import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { BookOpen, Fuel, CreditCard, Lock, Download, Upload, Dumbbell, Bike, TrainFront, MoreVertical, Unlock, CalendarDays, LayoutGrid, Eye, EyeOff, X, ChevronUp, ChevronDown, CheckSquare, RotateCcw, Book, Scale, TrendingUp, DollarSign, MapPin, Film } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const appLockPin = useStore(state => state.appLockPin);
  const setAppLockPin = useStore(state => state.setAppLockPin);
  const hiddenApps = useStore(state => state.hiddenApps);
  const toggleAppVisibility = useStore(state => state.toggleAppVisibility);
  const appOrder = useStore(state => state.appOrder);
  const setAppOrder = useStore(state => state.setAppOrder);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);

  const handleExport = () => {
    try {
      const rawData = localStorage.getItem('android-pwa-storage');
      if (!rawData) {
        alert('沒有資料可供匯出');
        return;
      }
      
      const parsedData = JSON.parse(rawData);
      // 使用 2格縮排 來輸出整齊易讀的 JSON
      const formattedJson = JSON.stringify(parsedData, null, 2);
      
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-hub-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('匯出失敗');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        if (jsonData && jsonData.state) {
           setPendingImportData(jsonData);
           setShowImportModal(true);
        } else {
           alert('無效的備份檔案格式。');
        }
      } catch (err) {
        console.error('Import failed', err);
        alert('檔案解析失敗，請確認是否為有效的 JSON 備份檔。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = (mode) => {
    if (!pendingImportData) return;

    try {
      if (mode === 'replace') {
        localStorage.setItem('android-pwa-storage', JSON.stringify(pendingImportData));
        alert('資料已「取代」成功！即將重新載入頁面...');
      } else if (mode === 'append') {
        const currentRaw = localStorage.getItem('android-pwa-storage');
        const mergedData = mergeStoreData(currentRaw, pendingImportData);
        localStorage.setItem('android-pwa-storage', JSON.stringify(mergedData));
        alert('資料已「添加」成功！原本資料已保留，並加入了備份檔內容。即將重新載入頁面...');
      }
      
      setShowImportModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Finalize import failed', err);
      alert('儲存匯入資料時發生錯誤。');
    }
  };

  const mergeStoreData = (currentRaw, importedRaw) => {
    if (!currentRaw) return importedRaw;
    
    try {
      const current = JSON.parse(currentRaw);
      const newState = { ...current.state };
      const importedState = importedRaw.state;

      for (const key in importedState) {
        const importedValue = importedState[key];
        const currentValue = newState[key];

        // Handle Arrays (Deduplicate by id or symbol)
        if (Array.isArray(importedValue)) {
          if (!Array.isArray(currentValue)) {
            newState[key] = importedValue;
            continue;
          }
          
          const combined = [...currentValue, ...importedValue];
          const seen = new Set();
          newState[key] = combined.filter(item => {
            if (item && typeof item === 'object') {
              // Try to find a unique identifier
              const id = item.id || (key === 'stockWatchlist' ? item.symbol : (key === 'marketIndices' ? item.id : null));
              if (id) {
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
              }
            }
            return true; 
          });
          
          // Special cases for sorting
          if (key === 'weightEntries') {
            newState[key].sort((a, b) => new Date(a.date) - new Date(b.date));
          }
          if (key === 'diaryEntries') {
            newState[key].sort((a, b) => new Date(b.date) - new Date(a.date));
          }
        } 
        // Handle Special Objects (like shiftSchedules)
        else if (key === 'shiftSchedules' && typeof importedValue === 'object' && importedValue !== null) {
          newState[key] = { ...currentValue, ...importedValue };
        }
        // settings/primitives are preserved from current state in "Append" mode
      }
      
      return { ...importedRaw, state: newState };
    } catch (e) {
      console.error('Merge logic failed', e);
      return importedRaw; // Fallback to replace if merge fails
    }
  };

  const handleToggleLockClick = () => {
    setIsMenuOpen(false);
    setPinInput('');
    setShowPinModal(true);
  };

  const handlePinSubmit = () => {
    if (appLockPin) {
      if (pinInput === appLockPin) {
        setAppLockPin(null);
        alert("程式鎖已關閉！");
        setShowPinModal(false);
      } else {
        alert("密碼錯誤！");
        setPinInput('');
      }
    } else {
      if (/^\d{4}$/.test(pinInput)) {
        setAppLockPin(pinInput);
        alert("程式鎖設定成功！下次進入程式將會要求密碼解鎖。");
        setShowPinModal(false);
      } else {
        alert("格式錯誤！請輸入 4 位數數字。");
      }
    }
  };

  // Pastel colors for sticky notes
  const baseApps = [
    { id: 'english', name: '英文學習', icon: BookOpen, bgColor: '#fef3c7', iconColor: '#d97706', rotate: -2, route: '/english', active: true },
    { id: 'fuel', name: '加油紀錄', icon: Fuel, bgColor: '#dcfce7', iconColor: '#16a34a', rotate: 3, route: '/fuel', active: true },
    { id: 'credit', name: '信用卡費', icon: CreditCard, bgColor: '#fce7f3', iconColor: '#db2777', rotate: -1, route: '/credit', active: true },
    { id: 'sport', name: '運動紀錄', icon: Dumbbell, bgColor: '#e0e7ff', iconColor: '#4f46e5', rotate: 2, route: '/sport', active: true },
    { id: 'ubike', name: 'YouBike', icon: Bike, bgColor: '#fef08a', iconColor: '#ca8a04', rotate: -3, route: '/ubike', active: true },
    { id: 'app6', name: '台鐵時刻表', icon: TrainFront, bgColor: '#e0f2fe', iconColor: '#0284c7', rotate: 1, route: '/tra', active: true },
    { id: 'shift', name: '排班表', icon: CalendarDays, bgColor: '#faf5ff', iconColor: '#d946ef', rotate: -2, route: '/shift', active: true },
    { id: 'todo', name: 'ToDo 清單', icon: CheckSquare, bgColor: '#f0fdf4', iconColor: '#16a34a', rotate: 1, route: '/todo', active: true },
    { id: 'luckydraw', name: '抽籤轉盤', icon: RotateCcw, bgColor: '#fff1f2', iconColor: '#e11d48', rotate: -1, route: '/luckydraw', active: true },
    { id: 'diary', name: '日記', icon: Book, bgColor: '#fef9c3', iconColor: '#ca8a04', rotate: 2, route: '/diary', active: true },
    { id: 'weight', name: '體重紀錄', icon: Scale, bgColor: '#ecfdf5', iconColor: '#059669', rotate: -2, route: '/weight', active: true },
    { id: 'stock', name: '簡單看盤', icon: TrendingUp, bgColor: '#e0f2fe', iconColor: '#0284c7', rotate: 1, route: '/stock', active: true },
    { id: 'answerbook', name: '答案之書', icon: BookOpen, bgColor: '#fef3c7', iconColor: '#d97706', rotate: -2, route: '/answerbook', active: true },
    { id: 'exchange', name: '極簡匯率', icon: DollarSign, bgColor: '#ecfccb', iconColor: '#65a30d', rotate: 2, route: '/exchange', active: true },
    { id: 'parking', name: '停車場在哪', icon: MapPin, bgColor: '#dbeafe', iconColor: '#2563eb', rotate: -1, route: '/parking', active: true },
    { id: 'movie', name: '電影院', icon: Film, bgColor: '#fee2e2', iconColor: '#ef4444', rotate: 2, route: '/movie', active: true },
    { id: 'whereami', name: '我在哪', icon: MapPin, bgColor: '#ffedd5', iconColor: '#f97316', rotate: -2, route: '/whereami', active: true },
  ];

  const sortedBaseApps = [...baseApps].sort((a, b) => {
    const iA = appOrder.includes(a.id) ? appOrder.indexOf(a.id) : 999;
    const iB = appOrder.includes(b.id) ? appOrder.indexOf(b.id) : 999;
    return iA - iB;
  });

  const displayApps = sortedBaseApps.filter(app => !hiddenApps.includes(app.id));

  const handleMoveApp = (appId, direction) => {
    const currentOrder = appOrder.length > 0 ? [...appOrder] : baseApps.map(a => a.id);
    // ensure all newly added apps are included dynamically
    baseApps.forEach(a => {
        if (!currentOrder.includes(a.id)) currentOrder.push(a.id);
    });
    
    // apply sorting based on currentOrder to avoid index mismatch
    currentOrder.sort((a, b) => {
        const idxA = currentOrder.indexOf(a);
        const idxB = currentOrder.indexOf(b);
        return idxA - idxB;
    });

    const currentDisplayOrder = sortedBaseApps.map(a => a.id);
    const idx = currentDisplayOrder.indexOf(appId);
    
    if (idx === -1) return;
    
    if (direction === 'up' && idx > 0) {
        const temp = currentDisplayOrder[idx - 1];
        currentDisplayOrder[idx - 1] = currentDisplayOrder[idx];
        currentDisplayOrder[idx] = temp;
    } else if (direction === 'down' && idx < currentDisplayOrder.length - 1) {
        const temp = currentDisplayOrder[idx + 1];
        currentDisplayOrder[idx + 1] = currentDisplayOrder[idx];
        currentDisplayOrder[idx] = temp;
    }
    
    setAppOrder(currentDisplayOrder);
  };
  
  // Padding with lock placeholders to ensure at least 6 sticky notes
  if (displayApps.length < 6) {
    const missingCount = 6 - displayApps.length;
    for (let i = 0; i < missingCount; i++) {
        displayApps.push({
            id: `placeholder-${i}`,
            name: ' ',
            icon: Lock,
            bgColor: '#f1f5f9',
            iconColor: '#94a3b8',
            rotate: i % 2 === 0 ? 2 : -3,
            active: false
        });
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
  };

  return (
    <div className="page-container" style={{ background: '#f8fafc', color: '#334155' }}>
      
      {/* Light Header Override */}
      <div className="app-header" style={{ background: 'transparent', borderBottom: 'none', color: '#1e293b', boxShadow: 'none', position: 'relative', zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Smart Life Hub</h1>
        
        {/* Dropdown Menu container */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ 
              padding: '8px', borderRadius: '50%', background: 'white', 
              border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <MoreVertical size={20} color="#64748b" />
          </button>
          
          {isMenuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '44px', width: '160px',
              background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden', zIndex: 1000, display: 'flex', flexDirection: 'column'
            }}>
              <label 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              >
                <Upload size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>匯入資料</span>
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => { setIsMenuOpen(false); handleImport(e); }} />
              </label>
              
              <button 
                onClick={() => { setIsMenuOpen(false); handleExport(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}
              >
                <Download size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>匯出資料</span>
              </button>

              <button 
                onClick={() => { setIsMenuOpen(false); setShowManageModal(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}
              >
                <LayoutGrid size={16} color="#64748b" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>管理首頁</span>
              </button>

              <button 
                onClick={handleToggleLockClick}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                {appLockPin ? <Unlock size={16} color="#ef4444" /> : <Lock size={16} color="#10b981" />}
                <span style={{ fontSize: '14px', fontWeight: '500', color: appLockPin ? '#ef4444' : '#10b981' }}>
                  {appLockPin ? '關閉程式鎖' : '啟用程式鎖'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu hack */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
        />
      )}

      {/* PIN Setup/Disable Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{appLockPin ? "關閉程式鎖" : "設定程式鎖"}</h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {appLockPin ? "請輸入原本的 PIN 碼以確認關閉：" : "請輸入 4 位數字建立您的專屬密碼："}
            </p>
            <input 
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="1234"
              style={{ padding: '12px', fontSize: '20px', letterSpacing: '8px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', color: '#0f172a', fontWeight: 'bold' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setShowPinModal(false)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >取消</button>
              <button 
                onClick={handlePinSubmit}
                style={{ flex: 1, padding: '12px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >確認</button>
            </div>
          </div>
        </div>
      )}

      {/* App Management Modal */}
      {showManageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>選取要顯示的功能</h3>
              <button 
                onClick={() => setShowManageModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>您可以隱藏不需要的功能，首頁將智能保留至少 6 個格子的最佳排版。</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
              {sortedBaseApps.map((app, index) => {
                const isHidden = hiddenApps.includes(app.id);
                return (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button 
                          onClick={() => handleMoveApp(app.id, 'up')} 
                          disabled={index === 0}
                          style={{ background: 'transparent', border: 'none', padding: '0', margin: '0', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? 'transparent' : '#94a3b8' }}
                        >
                          <ChevronUp size={20} />
                        </button>
                        <button 
                          onClick={() => handleMoveApp(app.id, 'down')} 
                          disabled={index === sortedBaseApps.length - 1}
                          style={{ background: 'transparent', border: 'none', padding: '0', margin: '0', cursor: index === sortedBaseApps.length - 1 ? 'default' : 'pointer', color: index === sortedBaseApps.length - 1 ? 'transparent' : '#94a3b8' }}
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
                         <div style={{ padding: '6px', background: app.bgColor, borderRadius: '8px', display: 'flex' }}>
                           <app.icon size={18} color={app.iconColor} />
                         </div>
                         <span style={{ fontWeight: '500', color: '#334155' }}>{app.name}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleAppVisibility(app.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', backgroundColor: isHidden ? '#f1f5f9' : '#eff6ff' }}
                    >
                      {isHidden ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#3b82f6" />}
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: isHidden ? '#94a3b8' : '#3b82f6' }}>
                        {isHidden ? '已隱藏' : '顯示中'}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Import Choice Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '16px', width: '90%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Upload size={28} color="#3b82f6" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>匯入資料處理方式</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                偵測到備份檔案，請選擇處理方式：
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => handleConfirmImport('append')}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
                  padding: '16px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  <TrendingUp size={16} /> 添加資料 (Append)
                </div>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>保留現有內容，僅加入備份檔中的新紀錄。</span>
              </button>

              <button 
                onClick={() => handleConfirmImport('replace')}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
                  padding: '16px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                  <RotateCcw size={16} /> 取代資料 (Replace)
                </div>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>刪除現有內容，完全改用備份檔中的資料。</span>
              </button>
            </div>

            <button 
              onClick={() => { setShowImportModal(false); setPendingImportData(null); }}
              style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >取消</button>
          </div>
        </div>
      )}

      <div className="page-content" style={{ padding: '8px 20px 32px' }}>
        
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>點擊便利貼進入應用程式</p>
        </div>

        <motion.div 
          className="grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            paddingBottom: '24px'
          }}
        >
          <AnimatePresence>
            {displayApps.map((app) => (
              <motion.div
                key={app.id}
                variants={itemVariants}
                layout
                initial="hidden"
                animate="show"
                exit="hidden"
                onClick={() => app.active && navigate(app.route)}
                whileHover={app.active ? { scale: 1.05, rotate: 0, zIndex: 10 } : {}}
                whileTap={app.active ? { scale: 0.95 } : {}}
                style={{
                  aspectRatio: '1',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: app.active ? 'pointer' : 'default',
                  opacity: app.active ? 1 : 0.8,
                  background: app.bgColor,
                  transform: `rotate(${app.rotate}deg)`,
                  boxShadow: '2px 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
                  borderRadius: '2px', // Sticky notes are relatively square
                }}
              >
                {/* Fake Tape element */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  width: '40px',
                  height: '16px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transform: `rotate(${Math.random() > 0.5 ? 2 : -2}deg)`
                }} />

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <app.icon color={app.iconColor} size={36} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#334155', fontFamily: 'inherit' }}>
                  {app.name}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
