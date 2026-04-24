import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Plus, RefreshCw, TrendingUp, TrendingDown, 
  ChevronUp, ChevronDown, Trash2, X, Info, Activity,
  BarChart3, Clock, Palette, Terminal, Palmtree, Ghost
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

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
    chartBg: '#ffffff',
    chartText: '#881337',
    chartGrid: 'rgba(251, 113, 133, 0.1)',
    icon: Ghost
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
    chartBg: 'transparent',
    chartText: '#94a3b8',
    chartGrid: 'rgba(255, 255, 255, 0.05)',
    icon: Terminal
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
    chartBg: '#ffffff',
    chartText: '#166534',
    chartGrid: 'rgba(22, 101, 52, 0.05)',
    icon: Palmtree
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
    chartBg: '#ffffff',
    chartText: '#000000',
    chartGrid: 'rgba(0, 0, 0, 0.05)',
    icon: Terminal
  }
};

// --- Yahoo Finance Service (Hybrid Fetch Support) ---
// 智能判斷：手機原生環境用 CapacitorHttp (繞過 CORS)，網頁環境用 Nginx Proxy

const smartRequest = async (url, isSearch = false) => {
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  if (Capacitor.isNativePlatform()) {
    // 手機原生：直接請求
    const response = await CapacitorHttp.get({ url, headers: commonHeaders });
    return response.data;
  } else {
    // 網頁環境：使用相對路徑代理 (需配合 Nginx 配置)
    const proxyPath = isSearch ? '/api/yahoo-search' : '/api/yahoo';
    const relativeUrl = url.replace(/https:\/\/query[12]\.finance\.yahoo\.com/, proxyPath);
    const res = await fetch(relativeUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }
};

const fetchYahooQuote = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
    const data = await smartRequest(url);
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - prevClose;
    const changePercent = ((change / prevClose) * 100).toFixed(2) + '%';
    
    return {
      price: price,
      change: parseFloat(change.toFixed(2)),
      changePercent: (change >= 0 ? '+' : '') + changePercent,
      name: meta.symbol,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    console.error('Yahoo Quote Error:', err);
    return null;
  }
};

const searchYahooStocks = async (keywords) => {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${keywords}&quotesCount=6&newsCount=0`;
    const data = await smartRequest(url, true);
    return { results: data.quotes || [] };
  } catch (err) {
    console.error('Yahoo Search Error:', err);
    return { error: 'FETCH_ERROR' };
  }
};

const fetchYahooChart = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`;
    const data = await smartRequest(url);
    const result = data.chart?.result?.[0];
    if (!result || !result.timestamp) return [];
    
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    return timestamps.map((ts, i) => ({
      time: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      volume: quotes.volume[i]
    })).filter(d => d.open != null && d.close != null);
  } catch (err) {
    console.error('Yahoo Chart Error:', err);
    return [];
  }
};

// --- Main App Component ---

export default function StockApp() {
  const navigate = useNavigate();
  const { 
    stockWatchlist, marketIndices, stockSettings,
    addToWatchlist, removeFromWatchlist, updateStockData, updateIndexData, setStockSettings 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const theme = themes[stockSettings.theme] || themes.serious;

  const handleRefreshAll = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    // 更新自選股
    for (const stock of stockWatchlist) {
       const data = await fetchYahooQuote(stock.symbol);
       if (data) updateStockData(stock.symbol, data);
    }

    // 更新市場指數
    const indexSymbols = {
      'TAIEX': '^TWII',
      'NASDAQ': '^IXIC',
      'SP500': '^GSPC'
    };
    for (const [id, symbol] of Object.entries(indexSymbols)) {
       const data = await fetchYahooQuote(symbol);
       if (data) updateIndexData(id, data);
    }

    setIsRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    let q = searchQuery;
    // Auto-suffix for 4-digit codes (Taiwan) if not already present
    if (/^\d{4}$/.test(q)) q += '.TW';
    
    const response = await searchYahooStocks(q);
    
    if (response.error) {
      alert('搜尋失敗，請檢查網路連線。');
      setSearchResults([]);
    } else {
      setSearchResults(response.results);
    }
    setIsSearching(false);
  };

  const getPriceColor = (change) => {
    if (change > 0) return stockSettings.useTaiwanColors ? '#ef4444' : '#10b981';
    if (change < 0) return stockSettings.useTaiwanColors ? '#10b981' : '#ef4444';
    return '#94a3b8';
  };

  const Card = ({ children, style = {}, ...props }) => (
    <div 
      {...props}
      style={{
        background: theme.cardBg,
        borderRadius: theme.radius,
        padding: '16px',
        boxShadow: theme.shadow,
        border: theme.border || '1px solid rgba(255,255,255,0.05)',
        ...style
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ 
      background: theme.bg, 
      height: '100dvh', 
      color: theme.text,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: theme.fontFamily,
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <div 
        className="modal-safe-header"
        style={{ 
          background: theme.primary, 
          color: 'white',
          borderBottom: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>簡單看盤</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleRefreshAll} style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowSearchModal(true)} style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            <Search size={18} />
          </button>
          <select 
             value={stockSettings.theme}
             onChange={(e) => setStockSettings({ theme: e.target.value })}
             style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '10px', padding: '6px', cursor: 'pointer', outline: 'none', fontWeight: 'bold', fontSize: '12px' }}
          >
             {Object.entries(themes).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        
        {/* Market Indices */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {marketIndices.map(idx => (
             <Card key={idx.id} style={{ padding: '12px' }}>
                <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>{idx.name}</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{idx.price || '---'}</div>
                <div style={{ fontSize: '12px', color: getPriceColor(idx.change), display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {idx.change > 0 ? '▲' : idx.change < 0 ? '▼' : ''} {idx.changePercent}
                </div>
             </Card>
          ))}
        </div>

        {/* Watchlist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <h2 style={{ fontSize: '15px', fontWeight: 'bold', opacity: 0.8, marginBottom: '4px' }}>我的自選股</h2>
           
           {stockWatchlist.map(stock => (
             <motion.div key={stock.symbol} whileTap={{ scale: 0.98 }} onClick={() => setSelectedStock(stock)}>
                <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {stock.symbol}
                        <span style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.6 }}>{stock.name}</span>
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '未更新'}
                    </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: getPriceColor(stock.change) }}>
                        {stock.price || '---'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: getPriceColor(stock.change), display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        {stock.change > 0 ? '▲' : stock.change < 0 ? '▼' : ''} 
                        {stock.change ? (stock.change > 0 ? `+${stock.change}` : stock.change) : ''}
                        ({stock.changePercent})
                    </div>
                    </div>
                </Card>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               style={{ background: theme.cardBg, width: '90%', maxWidth: '400px', borderRadius: theme.radius, padding: '24px', border: theme.border || '1px solid rgba(255,255,255,0.1)', color: theme.text }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>加入自選股</h3>
                   <button onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X /></button>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                   <input 
                      type="text" autoFocus placeholder="股票代碼 (例: 2330 或 AAPL)"
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      style={{ flex: 1, background: theme.bg, border: `1px solid ${theme.primary}30`, borderRadius: '12px', padding: '12px', color: theme.text, outline: 'none' }}
                   />
                   <button onClick={handleSearch} disabled={isSearching} style={{ background: theme.primary, border: 'none', borderRadius: '12px', padding: '12px', color: 'white', cursor: 'pointer' }}>
                      {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                   </button>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   {searchResults.map((res, i) => (
                      <div key={i} onClick={() => {
                        addToWatchlist({ symbol: res.symbol, name: res.longname || res.shortname || res.symbol });
                        setShowSearchModal(false);
                        setSearchQuery('');
                        setSearchResults([]);
                        // 立即抓取一次報價
                        fetchYahooQuote(res.symbol).then(data => data && updateStockData(res.symbol, data));
                      }} style={{ padding: '12px', background: theme.secondary, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', color: theme.primary }}>
                         <div>
                            <div style={{ fontWeight: 'bold' }}>{res.symbol}</div>
                            <div style={{ fontSize: '12px', opacity: 0.6 }}>{res.longname || res.shortname}</div>
                         </div>
                         <Plus size={20} />
                      </div>
                   ))}
                   
                   {searchQuery && !isSearching && searchResults.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                         <div style={{ fontSize: '13px', opacity: 0.5, marginBottom: '12px' }}>
                           找不到符合的股票代碼
                         </div>
                         <button 
                           onClick={() => {
                             let sym = searchQuery;
                             if (/^\d{4}$/.test(sym)) sym += '.TW';
                             addToWatchlist({ symbol: sym, name: '自定義股票' });
                             setShowSearchModal(false);
                             setSearchQuery('');
                           }}
                           style={{ background: theme.primary, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                         >
                           直接加入 "{searchQuery.includes('.') || !/^\d{4}$/.test(searchQuery) ? searchQuery : searchQuery + '.TW'}"
                         </button>
                      </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStock && (
           <StockDetailModal 
              stock={selectedStock} 
              onClose={() => setSelectedStock(null)} 
              removeFromWatchlist={removeFromWatchlist}
              theme={theme}
              priceColor={getPriceColor(selectedStock.change)}
           />
        )}
      </AnimatePresence>

    </div>
  );
}

function StockDetailModal({ stock, onClose, removeFromWatchlist, theme, priceColor }) {
  const chartContainerRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchYahooChart(stock.symbol);
      if (isMounted) {
        setHistory(data);
        setIsLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [stock.symbol]);

  useEffect(() => {
    if (!isLoading && history.length > 0 && chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: theme.chartBg },
          textColor: theme.chartText,
        },
        grid: {
          vertLines: { color: theme.chartGrid },
          horzLines: { color: theme.chartGrid },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#ef4444',
        downColor: '#10b981',
        borderVisible: false,
        wickUpColor: '#ef4444',
        wickDownColor: '#10b981',
      });

      candleSeries.setData(history);
      chart.timeScale().fitContent();

      const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [isLoading, history, theme]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: theme.bg, color: theme.text, display: 'flex', flexDirection: 'column', fontFamily: theme.fontFamily }}>
       <div 
         className="modal-safe-header"
         style={{ 
           borderBottom: theme.border || '1px solid rgba(255,255,255,0.1)' 
         }}
       >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onClose} style={{ background: theme.secondary, color: theme.primary, border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{stock.symbol}</h3>
          </div>
          <button onClick={() => { removeFromWatchlist(stock.symbol); onClose(); }} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={20} /></button>
       </div>

       <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ fontSize: '36px', fontWeight: '900', color: priceColor, marginBottom: '4px' }}>{stock.price || '---'}</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: priceColor, marginBottom: '24px' }}>
             {stock.change > 0 ? '▲' : stock.change < 0 ? '▼' : ''} {stock.change} ({stock.changePercent})
          </div>

          <div style={{ background: theme.cardBg, borderRadius: theme.radius, padding: '16px', marginBottom: '24px', border: theme.border || '1px solid rgba(255,255,255,0.05)' }}>
             <div ref={chartContainerRef} style={{ width: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoading && <RefreshCw className="animate-spin" />}
                {!isLoading && history.length === 0 && <span>查無數據 (API 限制)</span>}
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
             <div style={{ background: theme.cardBg, padding: '12px', borderRadius: theme.radius, border: theme.border }}>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>成交量</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{history.length > 0 ? history[history.length-1].volume.toLocaleString() : '---'}</div>
             </div>
             <div style={{ background: theme.cardBg, padding: '12px', borderRadius: theme.radius, border: theme.border }}>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>開盤價</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{history.length > 0 ? history[history.length-1].open : '---'}</div>
             </div>
          </div>
       </div>
    </div>
  );
}
