import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, Film, Settings, RefreshCw, AlertCircle, 
  Star, Calendar, ChevronRight, X, Play, Info, ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    border: 'none',
    accent: '#ffedd5'
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
    border: 'none',
    accent: '#1e293b'
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
    border: 'none',
    accent: '#f0f9ff'
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
    accent: '#fafafa'
  }
};

export default function MovieApp() {
  const navigate = useNavigate();
  const { 
    movieSettings, setMovieSettings,
    movieCredentials, setMovieCredentials 
  } = useStore();
  
  const theme = themes[movieSettings?.theme] || themes.forest;
  
  const [currentTab, setCurrentTab] = useState('now_playing'); // 'now_playing' | 'upcoming'
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(movieCredentials.apiKey || '');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const isConfigured = !!movieCredentials.apiKey;

  const fetchMovies = async (type = currentTab) => {
    if (!isConfigured) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const url = `https://api.themoviedb.org/3/movie/${type}?language=zh-TW&page=1`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${movieCredentials.apiKey}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.status_message || '取得電影資料失敗');
      setMovies(data.results || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured) {
      fetchMovies(currentTab);
    }
  }, [isConfigured, currentTab]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setMovieCredentials({ apiKey: tempApiKey });
    setShowSettings(false);
  };

  const appStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={appStyle}>
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>電影院</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setTempApiKey(movieCredentials.apiKey); setShowSettings(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '12px 16px', background: theme.cardBg, boxShadow: theme.shadow, borderBottom: theme.border, zIndex: 10 }}>
        <div style={{ display: 'flex', background: theme.secondary, borderRadius: '24px', padding: '4px' }}>
          <button 
            onClick={() => setCurrentTab('now_playing')} 
            style={{ flex: 1, padding: '8px', borderRadius: '20px', border: 'none', background: currentTab === 'now_playing' ? theme.cardBg : 'transparent', color: currentTab === 'now_playing' ? theme.primary : theme.text, fontWeight: 'bold', fontSize: '14px' }}
          >
            現正熱映
          </button>
          <button 
            onClick={() => setCurrentTab('upcoming')} 
            style={{ flex: 1, padding: '8px', borderRadius: '20px', border: 'none', background: currentTab === 'upcoming' ? theme.cardBg : 'transparent', color: currentTab === 'upcoming' ? theme.primary : theme.text, fontWeight: 'bold', fontSize: '14px' }}
          >
            即將上映
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {!isConfigured ? (
          /* API Key Setup Prompt - Redesigned UI */
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px', padding: '0 20px' }}>
            <div style={{ background: 'white', padding: '40px 30px', borderRadius: '32px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', width: '100%', maxWidth: '380px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#fff5f5', marginBottom: '24px' }}>
                <AlertCircle size={48} color="#f87171" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f766e', marginBottom: '16px', letterSpacing: '0.5px' }}>未設定 API 金鑰</h2>
              <div style={{ marginBottom: '32px', lineHeight: '1.6' }}>
                <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>請先申請並設定</p>
                <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>「TMDB」API Read Token</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>本功能將抓取最新全球電影資訊。</p>
              </div>
              <button 
                onClick={() => setShowSettings(true)} 
                style={{ width: '100%', padding: '16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', marginBottom: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(34, 197, 94, 0.2)' }}
              >
                前往設定
              </button>
              <button 
                onClick={() => window.open('https://www.themoviedb.org/settings/api', '_blank')} 
                style={{ background: 'none', border: 'none', color: '#22c55e', fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                前往 TMDB 官網 <ExternalLink size={14} style={{ opacity: 0.8 }} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', opacity: 0.5 }}>
                <RefreshCw size={48} className="spin" />
                <p style={{ marginTop: '16px', fontWeight: 'bold' }}>載入電影中...</p>
              </div>
            ) : errorMsg ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fee2e2', borderRadius: theme.radius, color: '#ef4444' }}>
                <AlertCircle size={40} style={{ marginBottom: '12px' }} />
                <p style={{ fontWeight: 'bold' }}>{errorMsg}</p>
                <button onClick={() => fetchMovies()} style={{ marginTop: '16px', padding: '8px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>重試</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <AnimatePresence>
                  {movies.map((movie) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMovie(movie)}
                      style={{ 
                        background: theme.cardBg, 
                        borderRadius: theme.radius, 
                        overflow: 'hidden', 
                        boxShadow: theme.shadow, 
                        border: theme.border,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '2/3', background: theme.secondary }}>
                        {movie.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                            alt={movie.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                            <Film size={48} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#facc15', padding: '2px 6px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                          <Star size={12} fill="#facc15" /> {movie.vote_average?.toFixed(1)}
                        </div>
                      </div>
                      <div style={{ padding: '12px', flex: 1 }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '40px' }}>{movie.title}</h3>
                        <div style={{ fontSize: '11px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={10} /> {movie.release_date}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {!isLoading && movies.length === 0 && !errorMsg && (
              <div style={{ textAlign: 'center', opacity: 0.5, padding: '100px 0' }}>
                <Film size={64} style={{ marginBottom: '16px' }} />
                <p>尚無電影資料</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Movie Details Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedMovie(null)}>
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              style={{ background: theme.cardBg, width: '100%', maxWidth: '500px', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', color: theme.text, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                {selectedMovie.backdrop_path ? (
                  <img src={`https://image.tmdb.org/t/p/w500${selectedMovie.backdrop_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: theme.secondary }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, ' + theme.cardBg + ', transparent)' }} />
                <button 
                  onClick={() => setSelectedMovie(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '0 24px 40px', marginTop: '-40px', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <img src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`} alt="" style={{ width: '100px', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }} />
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedMovie.title}</h2>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', background: theme.primary + '20', color: theme.primary, padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{selectedMovie.vote_average?.toFixed(1)} Rating</span>
                      <span style={{ fontSize: '11px', background: theme.secondary, color: theme.text, padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{selectedMovie.release_date}</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8, marginBottom: '24px' }}>
                  {selectedMovie.overview || '尚無內容簡介。'}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{ flex: 1, padding: '14px', borderRadius: '16px', background: theme.primary, color: 'white', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Play size={18} fill="white" /> 前往觀看
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.themoviedb.org/movie/${selectedMovie.id}`, '_blank')}
                    style={{ padding: '14px', borderRadius: '16px', background: theme.secondary, color: theme.text, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Info size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>電影院設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button key={key} onClick={() => setMovieSettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: movieSettings?.theme === key ? theme.primary : theme.secondary, color: movieSettings?.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid ' + theme.secondary, paddingTop: '16px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold' }}>TMDB API</h4>
              <button 
                type="button"
                onClick={() => window.open('https://www.themoviedb.org/settings/api', '_blank')}
                style={{ fontSize: '11px', background: '#22c55e20', color: '#22c55e', border: 'none', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}
              >
                取得金鑰
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings}>
              <div style={{ marginBottom: '4px', fontSize: '11px', opacity: 0.6 }}>請輸入 Read Access Token (v4 auth)</div>
              <textarea 
                value={tempApiKey} 
                onChange={e => setTempApiKey(e.target.value)} 
                placeholder="Bearer Token..." 
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', marginBottom: '20px', fontSize: '12px', resize: 'none' }} 
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: theme.primary, color: 'white', fontWeight: 'bold', border: 'none' }}>儲存設定</button>
                <button type="button" onClick={() => { setMovieCredentials({ apiKey:'' }); setShowSettings(false); }} style={{ padding: '14px', borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none' }}>登出</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
