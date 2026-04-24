import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  ArrowLeft, Plus, Check, Edit2, Trash2,
  Menu, X, ChevronRight, Tag, CheckCircle2, Circle
} from 'lucide-react';

export default function TodoApp() {
  const navigate = useNavigate();
  const {
    todoCategories, todoItems,
    addTodoCategory, deleteTodoCategory,
    addTodoItem, toggleTodoItem, editTodoItem, deleteTodoItem
  } = useStore();

  const [activeCategoryId, setActiveCategoryId] = useState('default');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [isEditingItemId, setIsEditingItemId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Literary/Cute style theme
  const theme = {
    bg: '#fcfaf2', // Fallback color
    bgImage: "url('/todo-bg.jpg')",
    accent: '#8ba88e', // Soft sage green
    text: '#4a4a4a',
    muted: '#9e9e9e',
    card: 'rgba(255, 255, 255, 0.85)', // Slightly translucent
    fontCute: "'ZCOOL KuaiLe', cursive",
    fontLiterary: "'ZCOOL XiaoWei', serif"
  };

  const currentCategory = useStore(state =>
    state.todoCategories.find(c => c.id === activeCategoryId) || state.todoCategories[0]
  );

  const filteredItems = useMemo(() => {
    return todoItems
      .filter(item => item.categoryId === activeCategoryId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [todoItems, activeCategoryId]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addTodoItem(activeCategoryId, newItemText.trim());
    setNewItemText('');
  };

  const handleStartEdit = (item) => {
    setIsEditingItemId(item.id);
    setEditText(item.text);
    setExpandedItemId(null);
  };

  const handleSaveEdit = (id) => {
    if (editText.trim()) {
      editTodoItem(id, editText.trim());
    }
    setIsEditingItemId(null);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addTodoCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  return (
    <div className="page-container" style={{
      background: theme.bg,
      color: theme.text,
      fontFamily: theme.fontLiterary,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: theme.bg, // Solid background for header
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        zIndex: 20
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '22px',
            margin: 0,
            fontFamily: theme.fontCute,
            color: theme.accent,
            letterSpacing: '1px'
          }}>
            {currentCategory?.name || '我的清單'}
          </h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', padding: '4px' }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundImage: theme.bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'local' // Makes bg scroll with content or stay fixed relative to div
      }}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: theme.card,
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                border: '1px solid rgba(139, 168, 142, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
              >
                <div onClick={(e) => { e.stopPropagation(); toggleTodoItem(item.id); }}>
                  {item.completed ? (
                    <CheckCircle2 size={22} color={theme.accent} />
                  ) : (
                    <Circle size={22} color={theme.muted} />
                  )}
                </div>

                {isEditingItemId === item.id ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={() => handleSaveEdit(item.id)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(item.id)}
                    style={{
                      flex: 1,
                      border: 'none',
                      borderBottom: `2px solid ${theme.accent}`,
                      background: 'transparent',
                      fontSize: '17px',
                      fontFamily: theme.fontCute,
                      outline: 'none',
                      color: theme.text,
                      padding: '2px 0'
                    }}
                  />
                ) : (
                  <span style={{
                    flex: 1,
                    fontSize: '17px',
                    fontFamily: theme.fontCute,
                    textDecoration: item.completed ? 'line-through' : 'none',
                    color: item.completed ? theme.muted : theme.text,
                    transition: 'all 0.3s ease'
                  }}>
                    {item.text}
                  </span>
                )}

                {!isEditingItemId && (
                  <ChevronRight
                    size={18}
                    color={theme.muted}
                    style={{
                      transform: expandedItemId === item.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                )}
              </div>

              {/* Inline Expansion Buttons */}
              <AnimatePresence>
                {expandedItemId === item.id && !isEditingItemId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                      overflow: 'hidden',
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end',
                      marginTop: '4px',
                      paddingTop: '8px',
                      borderTop: '1px dashed rgba(0,0,0,0.05)'
                    }}
                  >
                    <button
                      onClick={() => toggleTodoItem(item.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={14} /> {item.completed ? '取消完成' : '標記完成'}
                    </button>
                    <button
                      onClick={() => handleStartEdit(item)}
                      style={{
                        padding: '8px 12px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={14} /> 編輯
                    </button>
                    <button
                      onClick={() => deleteTodoItem(item.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} /> 刪除
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.muted,
            gap: '12px',
            opacity: 0.6
          }}>
            <h2 style={{ fontFamily: theme.fontCute, fontSize: '20px', margin: 0 }}>這裡空空的呀～</h2>
            <p style={{ fontSize: '14px' }}>點下方按鈕，開始寫下今天的小目標吧！</p>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div style={{ padding: '20px', background: 'transparent' }}>
        <form
          onSubmit={handleAddItem}
          style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 8px 8px 16px',
            borderRadius: '20px',
            boxShadow: '0 8px 25px rgba(139, 168, 142, 0.2)',
            border: '2px solid rgba(139, 168, 142, 0.3)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <input
            placeholder={`在「${currentCategory?.name}」中新增項目...`}
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '16px',
              fontFamily: theme.fontCute,
              outline: 'none',
              color: theme.text
            }}
          />
          <button
            type="submit"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '16px',
              background: theme.accent,
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Plus size={24} />
          </button>
        </form>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '280px', background: theme.bg, zIndex: 101,
                boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ margin: 0, fontFamily: theme.fontCute, fontSize: '20px', color: theme.accent }}>清單分類</h3>
                <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: theme.muted }}><X size={24} /></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todoCategories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => { setActiveCategoryId(cat.id); setIsSidebarOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '12px',
                      background: activeCategoryId === cat.id ? 'rgba(139, 168, 142, 0.1)' : 'transparent',
                      color: activeCategoryId === cat.id ? theme.accent : theme.text,
                      fontWeight: activeCategoryId === cat.id ? 'bold' : 'normal',
                      cursor: 'pointer'
                    }}
                  >
                    <Tag size={18} />
                    <span style={{ fontSize: '16px', fontFamily: theme.fontCute }}>{cat.name}</span>
                    <div style={{ flex: 1 }} />
                    {cat.id !== 'default' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTodoCategory(cat.id); if (activeCategoryId === cat.id) setActiveCategoryId('default'); }}
                        style={{ background: 'none', border: 'none', color: '#fda4af', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {showAddCategory ? (
                  <div style={{ padding: '8px 0', display: 'flex', gap: '8px' }}>
                    <input
                      autoFocus
                      placeholder="新分類名稱"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      style={{
                        flex: 1, border: 'none', borderBottom: `2px solid ${theme.accent}`,
                        background: 'transparent', outline: 'none', fontFamily: theme.fontCute
                      }}
                    />
                    <button onClick={handleAddCategory} style={{ background: theme.accent, border: 'none', color: 'white', borderRadius: '6px', padding: '4px 8px' }}>
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', borderRadius: '12px',
                      background: 'none', border: '1px dashed rgba(139, 168, 142, 0.4)',
                      color: theme.accent, cursor: 'pointer', marginTop: '12px'
                    }}
                  >
                    <Plus size={18} />
                    <span style={{ fontSize: '15px' }}>新增清單</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
