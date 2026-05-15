import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Lock, Delete } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppLockScreen({ onUnlock }) {
  const appLockPin = useStore(state => state.appLockPin);
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (inputPin.length === 4) {
      if (inputPin === appLockPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setInputPin('');
          setError(false);
        }, 500);
      }
    }
  }, [inputPin, appLockPin, onUnlock]);

  const handleKeyPress = (num) => {
    if (inputPin.length < 4) {
      setInputPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setInputPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-color)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
    }}>
      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '24px' }}>
          <Lock size={48} color="var(--accent-color)" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
          程式已上鎖
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>請輸入 4 位數解鎖密碼</p>
      </div>

      <motion.div 
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', gap: '20px', marginBottom: '60px' }}
      >
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: inputPin.length > i ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
            transition: 'background 0.2s',
            boxShadow: inputPin.length > i ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none'
          }} />
        ))}
      </motion.div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '300px', width: '100%'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            style={{
              padding: '24px 0', fontSize: '28px', fontWeight: 'bold',
              background: 'transparent', border: 'none', color: 'var(--text-primary)',
              borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {num}
          </button>
        ))}
        
        {/* Empty spot */}
        <div />
        
        <button
          onClick={() => handleKeyPress('0')}
          style={{
            padding: '24px 0', fontSize: '28px', fontWeight: 'bold',
            background: 'transparent', border: 'none', color: 'var(--text-primary)',
            borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          0
        </button>
        
        <button
          onClick={handleDelete}
          style={{
            padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', color: 'var(--text-primary)',
            borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Delete size={28} />
        </button>
      </div>
    </div>
  );
}
