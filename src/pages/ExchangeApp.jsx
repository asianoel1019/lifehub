import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Settings, X, ArrowDownUp, Star, Calculator as CalcIcon, Trash2 } from 'lucide-react';

const API_KEY = '4142f384a25542c0dd3a50b5';

const themes = {
  cartoon: {
    name: '可愛卡通',
    bg: '#fff1f2',
    card: 'white',
    text: '#881337',
    primary: '#fb7185',
    secondary: '#fbcfe8',
    radius: '24px',
    shadow: '0 8px 0 rgba(251, 113, 133, 0.1)',
    border: 'none',
    highlight: '#ffe4e6'
  },
  serious: {
    name: '專業嚴肅',
    bg: '#121212',
    card: '#1e1e1e',
    text: '#f1f5f9',
    primary: '#8b5cf6',
    secondary: '#334155',
    radius: '8px',
    shadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
    border: '1px solid #333',
    highlight: '#2d3748'
  },
  forest: {
    name: '清新森林',
    bg: '#f0fdf4',
    card: 'white',
    text: '#166534',
    primary: '#22c55e',
    secondary: '#dcfce7',
    radius: '16px',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: 'none',
    highlight: '#dcfce7'
  },
  minimalist: {
    name: '極簡黑白',
    bg: '#ffffff',
    card: 'white',
    text: '#000000',
    primary: '#000000',
    secondary: '#f3f4f6',
    radius: '0px',
    shadow: 'none',
    border: '1px solid #e5e7eb',
    highlight: '#f9fafb'
  }
};

const COMMON_CURRENCIES = ['USD', 'TWD', 'JPY', 'EUR', 'GBP', 'KRW', 'HKD', 'AUD', 'CAD', 'SGD', 'CNY', 'CHF', 'NZD', 'THB'];

export default function ExchangeApp() {
  const navigate = useNavigate();
  const { exchangeSettings, setExchangeSettings, exchangeFavorites, addExchangeFavorite, removeExchangeFavorite } = useStore();
  const theme = themes[exchangeSettings?.theme] || themes.minimalist;

  const [rates, setRates] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('TWD');
  const [amountStr, setAmountStr] = useState('100'); // Store as string to handle calc input
  const [showSettings, setShowSettings] = useState(false);

  // Calculator states
  const [calcMode, setCalcMode] = useState(false);
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [isNewInput, setIsNewInput] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
      const data = await res.json();
      if (data.result === 'success') {
        setRates(data.conversion_rates);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        setError(data['error-type'] || 'Failed to fetch rates');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const getConvertedAmount = () => {
    if (!amountStr || isNaN(amountStr) || !rates[baseCurrency] || !rates[targetCurrency]) return 0;
    const baseInUsd = 1 / rates[baseCurrency];
    const targetPerUsd = rates[targetCurrency];
    const rate = baseInUsd * targetPerUsd;
    const val = parseFloat(amountStr) * rate;
    
    if (val === 0) return 0;
    if (val < 0.01) return val.toFixed(6);
    if (val < 1) return val.toFixed(4);
    return val.toFixed(2);
  };

  const currentRateRatio = () => {
    if (!rates[baseCurrency] || !rates[targetCurrency]) return 0;
    const rate = (1 / rates[baseCurrency]) * rates[targetCurrency];
    return rate.toFixed(4);
  };

  const handleSwap = () => {
    setBaseCurrency(targetCurrency);
    setTargetCurrency(baseCurrency);
  };

  const isFavorite = exchangeFavorites.some(f => f.base === baseCurrency && f.target === targetCurrency);
  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeExchangeFavorite(baseCurrency, targetCurrency);
    } else {
      addExchangeFavorite(baseCurrency, targetCurrency);
    }
  };

  const handleFavoriteClick = (fav) => {
    setBaseCurrency(fav.base);
    setTargetCurrency(fav.target);
  };

  const handleCalcPress = (val) => {
    if (['+', '-', '*', '/'].includes(val)) {
      if (operator && !isNewInput) {
        evaluateCalc();
      } else {
        setPrevValue(parseFloat(amountStr));
      }
      setOperator(val);
      setIsNewInput(true);
    } else if (val === '=') {
      evaluateCalc();
      setOperator(null);
    } else if (val === 'C') {
      setAmountStr('0');
      setPrevValue(null);
      setOperator(null);
    } else if (val === 'DEL') {
      if (isNewInput) return;
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      if (isNewInput) {
        setAmountStr(val === '.' ? '0.' : val);
        setIsNewInput(false);
      } else {
        if (val === '.' && amountStr.includes('.')) return;
        setAmountStr(prev => prev === '0' && val !== '.' ? val : prev + val);
      }
    }
  };

  const evaluateCalc = () => {
    if (!operator || prevValue === null) return;
    const current = parseFloat(amountStr);
    let res = 0;
    switch(operator) {
      case '+': res = prevValue + current; break;
      case '-': res = prevValue - current; break;
      case '*': res = prevValue * current; break;
      case '/': res = current !== 0 ? prevValue / current : 0; break;
    }
    setAmountStr(parseFloat(res.toFixed(4)).toString());
    setPrevValue(parseFloat(res.toFixed(4)));
    setIsNewInput(true);
  };

  const calcButtons = [
    'C', 'DEL', '/', '*',
    '7', '8', '9', '-',
    '4', '5', '6', '+',
    '1', '2', '3', '=',
    '0', '.', ''
  ];

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100dvh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
      {/* Header */}
      <div style={{ background: theme.primary, color: 'white', borderBottom: theme.border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(12px + env(safe-area-inset-top, 0px)) 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>極簡匯率</h1>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Fixed Favorites Bar */}
      {exchangeFavorites.length > 0 && (
        <div style={{ 
          padding: '8px 16px', 
          background: theme.card, 
          borderBottom: theme.border || `1px solid ${theme.secondary}`,
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          scrollbarWidth: 'none',
          flexShrink: 0,
          zIndex: 10
        }}>
          {exchangeFavorites.map((fav, i) => (
            <button 
              key={i}
              onClick={() => handleFavoriteClick(fav)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                background: (fav.base === baseCurrency && fav.target === targetCurrency) ? theme.primary : theme.bg,
                color: (fav.base === baseCurrency && fav.target === targetCurrency) ? 'white' : theme.text,
                border: theme.border || `1px solid ${theme.secondary}`,
                borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <Star size={12} fill={(fav.base === baseCurrency && fav.target === targetCurrency) ? 'white' : 'transparent'} />
              {fav.base} ➞ {fav.target}
            </button>
          ))}
        </div>
      )}

      {/* Main Scrollable Content Area */}
      <div style={{ 
        flex: 1, 
        width: '100%',
        overflowY: 'auto'
      }}>
        <div style={{ 
          padding: '12px 16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'clamp(12px, 3vh, 20px)', 
          maxWidth: '480px', 
          margin: '0 auto', 
          width: '100%'
        }}>
          
          {/* Converter Card */}
          <div style={{ 
            background: theme.card, 
            borderRadius: theme.radius, 
            boxShadow: theme.shadow, 
            border: theme.border, 
            padding: 'clamp(16px, 4vw, 24px)', 
            position: 'relative',
            flexShrink: 0
          }}>
            <button 
              onClick={handleToggleFavorite}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: isFavorite ? '#eab308' : theme.secondary, cursor: 'pointer', zIndex: 1 }}
            >
              <Star size={24} fill={isFavorite ? '#eab308' : 'none'} color={isFavorite ? '#eab308' : theme.text} opacity={isFavorite ? 1 : 0.4} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', fontWeight: 'bold' }}>我有 (Base)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <select 
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    style={{ background: theme.secondary, color: theme.text, border: 'none', padding: '12px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', width: '90px', outline: 'none' }}
                  >
                    {Object.keys(rates).length > 0 ? Object.keys(rates).sort().map(c => <option key={c} value={c}>{c}</option>) : COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input 
                    type="text"
                    value={amountStr}
                    onChange={(e) => { setAmountStr(e.target.value); setIsNewInput(false); setOperator(null); }}
                    placeholder="0.00"
                    style={{ flex: 1, border: 'none', borderBottom: `2px solid ${theme.primary}`, background: 'transparent', color: theme.text, fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', outline: 'none', width: '100%', minWidth: 0 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <button 
                  onClick={handleSwap}
                  style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  <ArrowDownUp size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', fontWeight: 'bold' }}>換算為 (Target)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <select 
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    style={{ background: theme.secondary, color: theme.text, border: 'none', padding: '12px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', width: '90px', outline: 'none' }}
                  >
                    {Object.keys(rates).length > 0 ? Object.keys(rates).sort().map(c => <option key={c} value={c}>{c}</option>) : COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ flex: 1, fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: theme.primary, borderBottom: '2px solid transparent', padding: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {loading ? '...' : getConvertedAmount()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.5, textAlign: 'right' }}>
                  1 {baseCurrency} = {currentRateRatio()} {targetCurrency}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.6, padding: '0 8px' }}>
            {error ? <span style={{ color: 'red' }}>Error: {error}</span> : <span>最後更新: {lastUpdate || '載入中...'}</span>}
            <button onClick={fetchRates} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>手動更新</button>
          </div>

          {/* Calculator Panel */}
          <div style={{ 
            background: theme.card, 
            borderRadius: theme.radius, 
            padding: 'clamp(12px, 3vw, 16px)', 
            boxShadow: theme.shadow, 
            border: theme.border, 
            marginTop: 'auto',
            flexShrink: 0
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><CalcIcon size={16} /> 簡易計算機</span>
                {operator && <span style={{ fontSize: '14px', color: theme.primary, fontWeight: 'bold' }}>{prevValue} {operator}</span>}
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
               {calcButtons.map((btn, i) => {
                 if (btn === '') return <div key={i} />;
                 const isSpecial = ['C', 'DEL', '/', '*', '-', '+', '='].includes(btn);
                 return (
                   <button 
                     key={i}
                     onClick={() => handleCalcPress(btn)}
                     style={{
                       height: 'clamp(48px, 12vh, 64px)',
                       fontSize: 'clamp(16px, 5vw, 20px)',
                       fontWeight: 'bold',
                       border: theme.border || 'none',
                       borderRadius: '8px',
                       background: btn === '=' ? theme.primary : (isSpecial ? theme.secondary : theme.highlight),
                       color: btn === '=' ? 'white' : (isSpecial ? theme.primary : theme.text),
                       cursor: 'pointer',
                       gridColumn: btn === '=' ? 'span 2' : 'span 1',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center'
                     }}
                   >
                     {btn}
                   </button>
                 );
               })}
             </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: theme.card, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>匯率應用設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X /></button>
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block', opacity: 0.7 }}>主題風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button 
                    key={key} 
                    onClick={() => setExchangeSettings({ theme: key })} 
                    style={{ 
                      padding: '12px 0', 
                      borderRadius: theme.radius === '0px' ? '0' : '12px', 
                      border: theme.border || 'none', 
                      background: exchangeSettings?.theme === key ? theme.primary : theme.secondary, 
                      color: exchangeSettings?.theme === key ? 'white' : theme.text, 
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
