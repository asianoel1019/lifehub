import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Key, ArrowLeft, Plus, Search, Eye, EyeOff, Settings, X, PlusCircle, Trash2, CalendarDays, DollarSign, ExternalLink, ShieldAlert, Lock, Unlock, ChevronDown } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const themes = {
  forest: { bg: '#f0fdf4', primary: '#16a34a', secondary: '#dcfce7', text: '#14532d', accent: '#4ade80', cardBg: 'white', border: '1px solid #bbf7d0', radius: '20px' },
  cartoon: { bg: '#fffbeb', primary: '#f59e0b', secondary: '#fef3c7', text: '#78350f', accent: '#fbbf24', cardBg: 'white', border: '3px solid #f59e0b', radius: '24px' },
  serious: { bg: '#f8fafc', primary: '#334155', secondary: '#e2e8f0', text: '#0f172a', accent: '#64748b', cardBg: 'white', border: '1px solid #cbd5e1', radius: '8px' },
  minimalist: { bg: '#ffffff', primary: '#000000', secondary: '#f5f5f5', text: '#111111', accent: '#666666', cardBg: '#fafafa', border: '1px solid #e5e5e5', radius: '4px' },
};

const encrypt = (text, key) => CryptoJS.AES.encrypt(text, key).toString();
const decrypt = (cipher, key) => {
  if (!cipher) return '';
  // 如果字串不是以 AES 特徵開頭，代表是明碼（可能是從首頁匯入的原始資料）
  if (typeof cipher === 'string' && !cipher.startsWith('U2FsdGVkX1')) {
    return cipher;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    // 解密失敗時，如果是明碼則返回原值，否則返回空
    return (typeof cipher === 'string' && !cipher.startsWith('U2FsdGVkX1')) ? cipher : '';
  }
};

export default function PasswordApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    passwordKey,
    setPasswordKey,
    passwordCategories,
    addPasswordCategory,
    updatePasswordCategory,
    deletePasswordCategory,
    passwordEntries,
    addPasswordEntry,
    updatePasswordEntry,
    deletePasswordEntry,
    passwordSettings,
    setPasswordSettings,
    setPasswordEntries,
    appLockPin,
    setAppLockPin
  } = useStore();

  const theme = themes[passwordSettings?.theme] || themes.forest;

  const [selectedCategory, setSelectedCategory] = useState(passwordCategories[0]?.id || '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showCategoryManage, setShowCategoryManage] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null); // { id, field }


  // Form State
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    mail: '',
    notes: [''],
    amount: '',
    expireDate: '',
    userCode: ''
  });

  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [activeBackupTab, setActiveBackupTab] = useState(null); // null, 'export', 'import'
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (!passwordKey) {
      const newKey = CryptoJS.lib.WordArray.random(16).toString();
      setPasswordKey(newKey);
    }
  }, [passwordKey, setPasswordKey]);

  useEffect(() => {
    if (location.state?.editEntryId) {
      const entryToEdit = passwordEntries.find(e => e.id === location.state.editEntryId);
      if (entryToEdit) {
        setSelectedCategory(entryToEdit.categoryId);
        handleOpenForm(entryToEdit);
      }
      // Clear state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, passwordEntries, navigate, passwordKey]);


  const togglePasswordReveal = (id) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback({ id, field });
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  const isSubCategory = useMemo(() => {
    const cat = passwordCategories.find(c => c.id === selectedCategory);
    return cat && cat.name === '訂閱';
  }, [selectedCategory, passwordCategories]);

  const isFinancialCategory = useMemo(() => {
    const cat = passwordCategories.find(c => c.id === selectedCategory);
    return cat && cat.name === '金融';
  }, [selectedCategory, passwordCategories]);

  const filteredEntries = useMemo(() => {
    return passwordEntries
      .filter(e => {
        // If searching, ignore the category filter
        if (searchQuery) return true;
        // Otherwise, filter by selected category
        return e.categoryId === selectedCategory;
      })
      .filter(e => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const titleMatch = String(e.title || '').toLowerCase().includes(q);
        const userMatch = String(e.username || '').toLowerCase().includes(q);
        const mailMatch = String(e.mail || '').toLowerCase().includes(q);
        const notesMatch = e.notes?.some(n => String(n || '').toLowerCase().includes(q));
        return titleMatch || userMatch || mailMatch || notesMatch;
      });
  }, [passwordEntries, selectedCategory, searchQuery]);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addPasswordCategory({ name: newCatName.trim() });
      setNewCatName('');
    }
  };

  const handleUpdateCategory = (id) => {
    if (editCategoryName.trim()) {
      updatePasswordCategory(id, { name: editCategoryName.trim() });
      setEditingCategoryId(null);
      setEditCategoryName('');
    }
  };

  const handleDeleteCategory = (id) => {
    const cat = passwordCategories.find(c => c.id === id);
    const count = passwordEntries.filter(e => e.categoryId === id).length;
    
    if (window.confirm(`確定要刪除「${cat.name}」分類嗎？\n此分類下的 ${count} 筆密碼紀錄也將會被刪除！`)) {
      deletePasswordCategory(id);
      if (selectedCategory === id) {
        setSelectedCategory(passwordCategories.find(c => c.id !== id)?.id || '');
      }
    }
  };

  const handleToggleLockClick = () => {
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

  const handleOpenForm = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        title: entry.title || '',
        username: entry.username || '',
        password: decrypt(entry.password, passwordKey) || '',
        url: entry.url || '',
        mail: entry.mail || '',
        notes: entry.notes && entry.notes.length > 0 ? entry.notes : [''],
        amount: entry.amount || '',
        expireDate: entry.expireDate || '',
        userCode: entry.userCode || ''
      });
    } else {
      setEditingEntry(null);
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        mail: '',
        notes: [''],
        amount: '',
        expireDate: '',
        userCode: ''
      });
    }
    setShowFormPassword(false);
    setShowForm(true);
  };

  const handleSaveEntry = () => {
    if (!formData.title) return alert('請輸入標題');

    const entryData = {
      categoryId: selectedCategory,
      title: formData.title,
      username: formData.username,
      password: encrypt(formData.password, passwordKey),
      url: formData.url,
      mail: formData.mail,
      notes: formData.notes.filter(n => n.trim() !== ''),
      amount: formData.amount,
      expireDate: formData.expireDate,
      userCode: formData.userCode
    };

    if (editingEntry) {
      updatePasswordEntry(editingEntry.id, entryData);
    } else {
      addPasswordEntry(entryData);
    }

    setShowForm(false);
  };

  const handleDeleteEntry = (id) => {
    if (window.confirm('確定要刪除此密碼紀錄嗎？')) {
      deletePasswordEntry(id);
      setShowForm(false);
    }
  };

  const handleAddNote = () => {
    setFormData({ ...formData, notes: [...formData.notes, ''] });
  };

  const handleNoteChange = (index, value) => {
    const newNotes = [...formData.notes];
    newNotes[index] = value;
    setFormData({ ...formData, notes: newNotes });
  };

  const handleExportKey = () => {
    if (!passwordKey) return;
    setConfirmModal({
      show: true,
      title: '匯出金鑰警告',
      message: '請務必妥善保存此金鑰。若金鑰遺失，您將無法解密並還原匯出的密碼資料。確定要匯出嗎？',
      onConfirm: async () => {
        const fileName = `password-app-key.txt`;
        if (Capacitor.isNativePlatform()) {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: passwordKey,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
          });
          await Share.share({ title: '匯出密碼金鑰', url: result.uri });
        } else {
          const blob = new Blob([passwordKey], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setConfirmModal({ show: false });
      }
    });
  };

  const handleExportEntries = () => {
    setConfirmModal({
      show: true,
      title: '匯出資料警告',
      message: '匯出的資料為加密狀態，還原時需要配合原本的金鑰才能正確讀取。確定要匯出嗎？',
      onConfirm: async () => {
        const fileName = `password-entries-${new Date().toISOString().split('T')[0]}.json`;
        const content = JSON.stringify(passwordEntries, null, 2);
        
        if (Capacitor.isNativePlatform()) {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: content,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
          });
          await Share.share({ title: '匯出密碼紀錄', url: result.uri });
        } else {
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setConfirmModal({ show: false });
      }
    });
  };

  const handleImportKey = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const key = event.target.result.trim();
      if (key && key.length > 10) {
        setPasswordKey(key);
        setConfirmModal({ show: true, title: '成功', message: '金鑰匯入成功！', onConfirm: () => setConfirmModal({ show: false }) });
      } else {
        setConfirmModal({ show: true, title: '錯誤', message: '無效的金鑰檔案。', onConfirm: () => setConfirmModal({ show: false }) });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportEntries = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          // Auto-encrypt plain text passwords if they don't look like CryptoJS AES output
          const processedData = data.map(entry => {
            const pwd = String(entry.password || '');
            if (pwd && !pwd.startsWith('U2FsdGVkX1')) {
              return { ...entry, password: encrypt(pwd, passwordKey) };
            }
            return entry;
          });

          if (passwordEntries.length > 0) {
            setConfirmModal({
              show: true,
              title: '匯入資料',
              message: `偵測到現有 ${passwordEntries.length} 筆資料。您想要將新匯入的 ${processedData.length} 筆紀錄「添加」到現有資料後，還是「取代」目前的資料？`,
              buttons: [
                {
                  text: '添加 (Add)',
                  primary: true,
                  onClick: () => {
                    // Generate new IDs for added entries to prevent duplicates
                    const dataWithNewIds = processedData.map(item => ({
                      ...item,
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
                    }));
                    setPasswordEntries([...passwordEntries, ...dataWithNewIds]);
                    setConfirmModal({ show: false });
                    setTimeout(() => {
                      setConfirmModal({ show: true, title: '成功', message: `已成功添加 ${processedData.length} 筆資料！`, onConfirm: () => setConfirmModal({ show: false }) });
                    }, 500);
                  }
                },
                {
                  text: '取代 (Replace)',
                  onClick: () => {
                    setPasswordEntries(processedData);
                    setConfirmModal({ show: false });
                    setTimeout(() => {
                      setConfirmModal({ show: true, title: '成功', message: `已成功取代為 ${processedData.length} 筆資料！`, onConfirm: () => setConfirmModal({ show: false }) });
                    }, 500);
                  }
                },
                {
                  text: '取消',
                  onClick: () => setConfirmModal({ show: false })
                }
              ]
            });
          } else {
            setConfirmModal({
              show: true,
              title: '確認匯入',
              message: `即將匯入 ${processedData.length} 筆密碼紀錄，是否確定？`,
              onConfirm: () => {
                setPasswordEntries(processedData);
                setConfirmModal({ show: true, title: '成功', message: '密碼紀錄匯入成功！', onConfirm: () => setConfirmModal({ show: false }) });
              }
            });
          }
        } else {
          setConfirmModal({ show: true, title: '錯誤', message: '匯入失敗，JSON 格式不正確。', onConfirm: () => setConfirmModal({ show: false }) });
        }
      } catch (err) {
        setConfirmModal({ show: true, title: '錯誤', message: '匯入失敗，請確認檔案格式。', onConfirm: () => setConfirmModal({ show: false }) });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={24} />
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>我的密碼</h1>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
          <Settings size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Pane - Categories (2/10) */}
        <div style={{ width: '20%', background: theme.secondary, borderRight: theme.border, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>分類</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {passwordCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setSearchQuery(''); setRevealedPasswords({}); }}
                  style={{
                    padding: '12px',
                    borderRadius: theme.radius,
                    background: selectedCategory === cat.id ? theme.primary : 'transparent',
                    color: selectedCategory === cat.id ? 'white' : theme.text,
                    border: 'none',
                    textAlign: 'left',
                    fontWeight: selectedCategory === cat.id ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane - Passwords (8/10) */}
        <div style={{ width: '80%', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
          {/* Search Bar */}
          <div style={{ padding: '16px', borderBottom: theme.border }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color={theme.accent} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋標題或帳號..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 36px',
                  borderRadius: theme.radius,
                  border: theme.border,
                  background: theme.cardBg,
                  color: theme.text,
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Entries List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.accent, padding: '40px' }}>
                <Key size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p>尚無密碼紀錄</p>
              </div>
            ) : (
              filteredEntries.map(entry => {
                const entryCategory = passwordCategories.find(c => c.id === entry.categoryId);
                const isSub = entryCategory?.name === '訂閱';
                const isFin = entryCategory?.name === '金融';
                
                return (
                  <div key={entry.id} style={{ background: theme.cardBg, padding: '8px 12px', borderRadius: '8px', border: theme.border, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: theme.primary }}>{entry.title}</h3>
                        {searchQuery && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', background: theme.secondary, color: theme.primary, borderRadius: '4px', fontWeight: 'bold' }}>
                            {entryCategory?.name || '未分類'}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleOpenForm(entry)} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', padding: '4px' }}>
                        <Settings size={22} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '12px' }}>
                      {entry.username && (
                        <div 
                          onClick={() => copyToClipboard(entry.username, entry.id, 'username')}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                          title="點擊複製帳號"
                        >
                          <span style={{ color: theme.accent, width: '60px' }}>帳號:</span>
                          <span style={{ fontWeight: '500' }}>{entry.username}</span>
                          {copyFeedback?.id === entry.id && copyFeedback?.field === 'username' && (
                            <span style={{ position: 'absolute', right: '-50px', background: theme.primary, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', zIndex: 5 }}>已複製!</span>
                          )}
                        </div>
                      )}

                      {entry.password && (
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <span style={{ color: theme.accent, width: '60px' }}>密碼:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span 
                              onClick={() => revealedPasswords[entry.id] && copyToClipboard(decrypt(entry.password, passwordKey), entry.id, 'password')}
                              style={{ 
                                fontFamily: 'monospace', 
                                letterSpacing: revealedPasswords[entry.id] ? '0' : '2px', 
                                flex: 1,
                                cursor: revealedPasswords[entry.id] ? 'pointer' : 'default'
                              }}
                              title={revealedPasswords[entry.id] ? "點擊複製密碼" : ""}
                            >
                              {revealedPasswords[entry.id] ? decrypt(entry.password, passwordKey) : '******'}
                            </span>
                            {copyFeedback?.id === entry.id && copyFeedback?.field === 'password' && (
                              <span style={{ position: 'absolute', right: '30px', background: theme.primary, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', zIndex: 5 }}>已複製!</span>
                            )}
                            <button onClick={() => togglePasswordReveal(entry.id)} style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', padding: 0 }}>
                              {revealedPasswords[entry.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {(isFin || entry.userCode) && (
                        <div 
                          onClick={() => copyToClipboard(entry.userCode, entry.id, 'userCode')}
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                          title="點擊複製代碼"
                        >
                          <span style={{ color: theme.accent, width: '60px' }}>代碼:</span>
                          <span style={{ fontWeight: '500' }}>{entry.userCode}</span>
                          {copyFeedback?.id === entry.id && copyFeedback?.field === 'userCode' && (
                            <span style={{ position: 'absolute', right: '-50px', background: theme.primary, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', zIndex: 5 }}>已複製!</span>
                          )}
                        </div>
                      )}

                      {entry.url && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: theme.accent, width: '60px' }}>網址:</span>
                          <a href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {entry.url} <ExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      {isSub && entry.amount && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: theme.accent, width: '60px' }}>金額:</span>
                          <span style={{ fontWeight: '500', color: '#ef4444' }}>${entry.amount}</span>
                        </div>
                      )}

                      {isSub && entry.expireDate && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: theme.accent, width: '60px' }}>到期日:</span>
                          <span style={{ fontWeight: '500' }}>{entry.expireDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => handleOpenForm()}
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: theme.primary,
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: theme.cardBg,
                width: '100%',
                maxHeight: '90vh',
                borderTopLeftRadius: theme.radius,
                borderTopRightRadius: theme.radius,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{editingEntry ? '編輯紀錄' : '新增紀錄'}</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>標題</label>
                  <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>帳號</label>
                  <input type="text" placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>密碼</label>
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input type={showFormPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ flex: 1, padding: '10px', paddingRight: '40px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                    <button onClick={() => setShowFormPassword(!showFormPassword)} style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer' }}>
                      {showFormPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {(isFinancialCategory || formData.userCode) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>使用者代碼</label>
                    <input type="text" placeholder="User Code" value={formData.userCode} onChange={e => setFormData({ ...formData, userCode: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>網址</label>
                  <input type="url" placeholder="URL" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>信箱</label>
                  <input type="email" placeholder="Email" value={formData.mail} onChange={e => setFormData({ ...formData, mail: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                </div>

                {isSubCategory && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>金額</label>
                      <input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>到期日</label>
                      <input type="date" value={formData.expireDate} onChange={e => setFormData({ ...formData, expireDate: e.target.value })} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                    </div>
                  </>
                )}

                <div style={{ marginTop: '8px' }}>
                  {formData.notes.map((note, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <label style={{ width: '80px', fontWeight: 'bold', color: theme.primary }}>
                        {index === 0 ? '備註' : ''}
                      </label>
                      <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Notes" value={note} onChange={e => handleNoteChange(index, e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: theme.radius, border: theme.border, outline: 'none', background: theme.bg, color: theme.text }} />
                        {index > 0 && (
                          <button onClick={() => handleRemoveNote(index)} style={{ padding: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '80px' }} />
                    <button onClick={handleAddNote} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  {editingEntry && (
                    <button onClick={() => handleDeleteEntry(editingEntry.id)} style={{ flex: 1, padding: '16px', background: 'transparent', color: '#ef4444', border: `1px solid #ef4444`, borderRadius: theme.radius, fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                      刪除
                    </button>
                  )}
                  <button onClick={handleSaveEntry} style={{ flex: 2, padding: '16px', background: theme.primary, color: 'white', border: 'none', borderRadius: theme.radius, fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                    儲存
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: theme.cardBg, padding: '24px', borderRadius: theme.radius, width: '90%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: theme.primary }}>App 設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
              {/* Theme Section */}
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: theme.primary }}>主題風格</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {Object.entries(themes).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setPasswordSettings({ ...passwordSettings, theme: key })}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: passwordSettings?.theme === key ? t.primary : t.secondary,
                        color: passwordSettings?.theme === key ? 'white' : t.text,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '13px'
                      }}
                    >
                      {key === 'forest' ? '森林綠' : key === 'cartoon' ? '卡通橘' : key === 'serious' ? '沉穩藍' : '極簡黑'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Management Section */}
              <div style={{ borderTop: theme.border, paddingTop: '16px' }}>
                <button 
                  onClick={() => setShowCategoryManage(!showCategoryManage)}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '0 0 10px 0', 
                    cursor: 'pointer',
                    color: theme.primary,
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  <span>分類管理</span>
                  <motion.div animate={{ rotate: showCategoryManage ? 180 : 0 }}>
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showCategoryManage && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '4px' }}>
                        {passwordCategories.map(cat => (
                          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: theme.bg, padding: '8px', borderRadius: '8px', border: theme.border }}>
                            {editingCategoryId === cat.id ? (
                              <>
                                <input 
                                  type="text" 
                                  value={editCategoryName} 
                                  onChange={e => setEditCategoryName(e.target.value)} 
                                  style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: theme.border, outline: 'none', fontSize: '14px' }}
                                  autoFocus
                                />
                                <button onClick={() => handleUpdateCategory(cat.id)} style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', padding: '4px' }}><Plus size={18} /></button>
                                <button onClick={() => setEditingCategoryId(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
                              </>
                            ) : (
                              <>
                                <span style={{ flex: 1, fontSize: '14px' }}>{cat.name}</span>
                                <button 
                                  onClick={() => { setEditingCategoryId(cat.id); setEditCategoryName(cat.name); }} 
                                  style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', padding: '4px' }}
                                >
                                  <Settings size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCategory(cat.id)} 
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        
                        {/* Add New Category Inline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            placeholder="新增分類名稱..." 
                            value={newCatName} 
                            onChange={e => setNewCatName(e.target.value)}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: theme.border, outline: 'none', fontSize: '14px' }}
                          />
                          <button 
                            onClick={handleAddCategory}
                            style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Security Section */}
              <div style={{ borderTop: theme.border, paddingTop: '16px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: theme.primary }}>安全設定</p>
                <button 
                  onClick={handleToggleLockClick}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px', 
                    background: appLockPin ? '#fef2f2' : '#ecfdf5', 
                    color: appLockPin ? '#ef4444' : '#10b981', 
                    border: `1px solid ${appLockPin ? '#fecaca' : '#bbf7d0'}`, 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {appLockPin ? <Unlock size={18} /> : <Lock size={18} />}
                    <span>{appLockPin ? '關閉程式密碼鎖' : '啟用程式密碼鎖'}</span>
                  </div>
                  <div style={{ width: '40px', height: '20px', background: appLockPin ? '#ef4444' : '#d1d5db', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '2px', left: appLockPin ? '22px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }} />
                  </div>
                </button>
              </div>

              {/* Data Backup Section */}
              <div style={{ borderTop: theme.border, paddingTop: '16px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: theme.primary }}>資料備份</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button 
                    onClick={() => setActiveBackupTab(activeBackupTab === 'export' ? null : 'export')} 
                    style={{ padding: '10px', borderRadius: '10px', background: activeBackupTab === 'export' ? theme.primary : theme.secondary, color: activeBackupTab === 'export' ? 'white' : theme.primary, border: `1px solid ${theme.primary}`, fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    匯出
                  </button>
                  <button 
                    onClick={() => setActiveBackupTab(activeBackupTab === 'import' ? null : 'import')} 
                    style={{ padding: '10px', borderRadius: '10px', background: activeBackupTab === 'import' ? theme.primary : theme.secondary, color: activeBackupTab === 'import' ? 'white' : theme.primary, border: `1px solid ${theme.primary}`, fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    匯入
                  </button>
                </div>

                {activeBackupTab === 'export' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px', background: theme.bg, borderRadius: '8px', marginTop: '8px' }}>
                    <button onClick={handleExportKey} style={{ padding: '10px', fontSize: '12px', borderRadius: '8px', border: theme.border, background: 'white', cursor: 'pointer' }}>匯出金鑰</button>
                    <button onClick={handleExportEntries} style={{ padding: '10px', fontSize: '12px', borderRadius: '8px', border: theme.border, background: 'white', cursor: 'pointer' }}>匯出資料</button>
                  </motion.div>
                )}

                {activeBackupTab === 'import' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px', background: theme.bg, borderRadius: '8px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', fontSize: '12px', borderRadius: '8px', border: theme.border, background: 'white', cursor: 'pointer' }}>
                      匯入金鑰
                      <input type="file" accept=".txt" onChange={handleImportKey} style={{ display: 'none' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', fontSize: '12px', borderRadius: '8px', border: theme.border, background: 'white', cursor: 'pointer' }}>
                      匯入資料
                      <input type="file" accept=".json" onChange={handleImportEntries} style={{ display: 'none' }} />
                    </label>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'white', padding: '24px', borderRadius: '16px', maxWidth: '320px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: theme.primary }}>
                <ShieldAlert size={28} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{confirmModal.title}</h3>
              </div>
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginBottom: '24px' }}>
                {confirmModal.message}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexDirection: confirmModal.buttons ? 'column' : 'row' }}>
                {confirmModal.buttons ? (
                  confirmModal.buttons.map((btn, idx) => (
                    <button
                      key={idx}
                      onClick={btn.onClick}
                      style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '12px', 
                        background: btn.primary ? theme.primary : (btn.text === '取消' ? '#f3f4f6' : theme.secondary), 
                        border: 'none', 
                        color: btn.primary ? 'white' : (btn.text === '取消' ? '#4b5563' : theme.primary), 
                        fontWeight: 'bold', 
                        cursor: 'pointer' 
                      }}
                    >
                      {btn.text}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f3f4f6', border: 'none', color: '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      取消
                    </button>
                    <button
                      onClick={confirmModal.onConfirm}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', background: theme.primary, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      確定
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Setup/Disable Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: theme.cardBg, padding: '24px', borderRadius: theme.radius, width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: theme.border }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: theme.primary, margin: 0 }}>{appLockPin ? "關閉程式鎖" : "設定程式鎖"}</h3>
            <p style={{ fontSize: '14px', color: theme.text, opacity: 0.8, margin: 0 }}>
              {appLockPin ? "請輸入原本的 PIN 碼以確認關閉：" : "請輸入 4 位數字建立您的專屬密碼："}
            </p>
            <input 
              type="password" 
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="1234"
              autoFocus
              style={{ padding: '12px', fontSize: '24px', letterSpacing: '8px', textAlign: 'center', border: theme.border, borderRadius: '8px', outline: 'none', color: theme.text, fontWeight: 'bold', background: theme.bg }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setShowPinModal(false)}
                style={{ flex: 1, padding: '12px', background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >取消</button>
              <button 
                onClick={handlePinSubmit}
                style={{ flex: 1, padding: '12px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
              >確認</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
