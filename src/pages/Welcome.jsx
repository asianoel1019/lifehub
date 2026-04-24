import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export default function Welcome() {
  const navigate = useNavigate();
  const setHasSeenWelcome = useStore(state => state.setHasSeenWelcome);

  const handleEnter = () => {
    setHasSeenWelcome();
    navigate('/');
  };

  return (
    <div 
      className="page-container" 
      onClick={handleEnter}
      style={{ cursor: 'pointer', background: '#ffffff', position: 'relative' }}
    >
      <motion.img 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        src="/cover.png" 
        alt="Smart Life Hub Cover" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      {/* 隱形的可點擊遮罩，確保畫面任何一處都能觸發進入首頁 */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
