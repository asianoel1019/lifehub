import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  ArrowLeft, Dumbbell, Settings, Activity, ChevronRight,
  RefreshCw, AlertCircle, Calendar as CalendarIcon,
  ChevronLeft, X, Footprints, Bike, Waves, Zap
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

const getTypeColor = (type) => {
  if (type.includes('Run')) return '#e11d48'; // Red
  if (type.includes('Ride')) return '#16a34a'; // Green
  if (type === 'WeightTraining' || type === 'Workout') return '#9333ea'; // Purple
  if (type.includes('Swim')) return '#0ea5e9'; // Blue
  return '#f59e0b'; // Yellow for others
};

const getTypeIcon = (type) => {
  if (type.includes('Run')) return <Footprints size={20} />;
  if (type.includes('Ride')) return <Bike size={20} />;
  if (type === 'WeightTraining' || type === 'Workout') return <Dumbbell size={20} />;
  if (type.includes('Swim')) return <Waves size={20} />;
  return <Zap size={20} />;
};

const getTypeLabel = (type) => {
  if (type.includes('Run')) return '跑步';
  if (type.includes('Ride')) return '騎行';
  if (type === 'WeightTraining') return '重訓';
  if (type === 'Workout') return '訓練';
  if (type.includes('Swim')) return '游泳';
  return type;
};

export default function SportApp() {
  const navigate = useNavigate();
  const {
    stravaCredentials, stravaActivities, setStravaCredentials, setStravaActivities,
    sportSettings, setSportSettings
  } = useStore();

  const theme = themes[sportSettings?.theme] || themes.forest;

  const [showSettings, setShowSettings] = useState(false);
  const [tempCreds, setTempCreds] = useState(stravaCredentials);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [page, setPage] = useState(1);
  const [displayCount, setDisplayCount] = useState(10);
  const [currentTab, setCurrentTab] = useState('overview');
  const [viewingDate, setViewingDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const isConfigured = stravaCredentials.clientId && stravaCredentials.clientSecret;
  const hasRefreshToken = !!stravaCredentials.refreshToken;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && isConfigured) exchangeToken(code);
  }, [window.location.search, isConfigured]);

  const exchangeToken = async (code) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: stravaCredentials.clientId,
          client_secret: stravaCredentials.clientSecret,
          code: code,
          grant_type: 'authorization_code'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '授權失敗');
      setStravaCredentials({ ...stravaCredentials, refreshToken: data.refresh_token });
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchActivitiesWithToken(data.access_token, 1, false);
    } catch (err) { setErrorMsg(err.message); }
    finally { setIsLoading(false); }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setStravaCredentials(tempCreds);
    setShowSettings(false);
  };

  const fetchActivities = async (fetchPage = 1, append = false) => {
    if (!isConfigured) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: stravaCredentials.clientId, client_secret: stravaCredentials.clientSecret, refresh_token: stravaCredentials.refreshToken, grant_type: 'refresh_token' })
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.message || '無法更新 Token');
      if (tokenData.refresh_token && tokenData.refresh_token !== stravaCredentials.refreshToken) {
        setStravaCredentials({ ...stravaCredentials, refreshToken: tokenData.refresh_token });
      }
      await fetchActivitiesWithToken(tokenData.access_token, fetchPage, append);
    } catch (err) { setErrorMsg(err.message); }
    finally { setIsLoading(false); }
  };

  const fetchActivitiesWithToken = async (accessToken, fetchPage, append) => {
    try {
      const actRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?page=${fetchPage}&per_page=50`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const actData = await actRes.json();
      if (!actRes.ok) throw new Error(actData.message || '無法取得紀錄');
      if (append) {
        const existingIds = new Set(stravaActivities.map(a => a.id));
        const combined = [...stravaActivities, ...actData.filter(a => !existingIds.has(a.id))];
        combined.sort((a, b) => new Date(b.start_date_local) - new Date(a.start_date_local));
        setStravaActivities(combined);
      } else setStravaActivities(actData);
      setPage(fetchPage);
    } catch (err) { setErrorMsg(err.message); }
  };

  useEffect(() => { if (isConfigured && stravaActivities.length === 0) fetchActivities(1, false); }, [isConfigured]);

  const handlePrevMonth = () => {
    setViewingDate(new Date(viewingDate.getFullYear(), viewingDate.getMonth() - 1, 1));
    setSelectedCalendarDate(null);
  };
  const handleNextMonth = () => {
    setViewingDate(new Date(viewingDate.getFullYear(), viewingDate.getMonth() + 1, 1));
    setSelectedCalendarDate(null);
  };

  const currentMonth = viewingDate.getMonth();
  const currentYear = viewingDate.getFullYear();
  const thisMonthActivities = stravaActivities.filter(act => {
    const actDate = new Date(act.start_date_local);
    return actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear;
  });

  const monthRunMeters = thisMonthActivities.filter(a => a.type.includes('Run')).reduce((sum, a) => sum + (a.distance || 0), 0);
  const monthRideMeters = thisMonthActivities.filter(a => a.type.includes('Ride')).reduce((sum, a) => sum + (a.distance || 0), 0);
  const monthWeightTrainingSeconds = thisMonthActivities.filter(a => a.type === 'WeightTraining' || a.type === 'Workout').reduce((sum, a) => sum + (a.moving_time || a.elapsed_time || 0), 0);

  let filteredActivities = thisMonthActivities;
  if (selectedCalendarDate) {
    filteredActivities = stravaActivities.filter(act => {
      const d = new Date(act.start_date_local);
      return d.getFullYear() === selectedCalendarDate.getFullYear() && d.getMonth() === selectedCalendarDate.getMonth() && d.getDate() === selectedCalendarDate.getDate();
    });
  }
  const visibleActivities = filteredActivities.slice(0, displayCount);

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const appStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease'
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDay = new Date(currentYear, currentMonth, 1).getDay();
    const startDayIndex = startDay === 0 ? 6 : startDay - 1;
    const actsByDate = {};
    thisMonthActivities.forEach(act => {
      const d = new Date(act.start_date_local).getDate();
      if (!actsByDate[d]) actsByDate[d] = [];
      actsByDate[d].push(act);
    });
    const days = [];
    for (let i = 0; i < startDayIndex; i++) days.push(<div key={`empty-${i}`} />);
    for (let i = 1; i <= daysInMonth; i++) {
      const acts = actsByDate[i] || [];
      const isSelected = selectedCalendarDate?.getDate() === i && selectedCalendarDate?.getMonth() === currentMonth;
      const isToday = new Date().getDate() === i && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
      days.push(
        <div key={`day-${i}`} onClick={() => setSelectedCalendarDate(isSelected ? null : new Date(currentYear, currentMonth, i))} style={{ padding: '6px 2px', minHeight: '60px', border: isSelected ? '2px solid ' + theme.primary : theme.border || '1px solid ' + theme.secondary, background: isSelected ? theme.secondary : theme.cardBg, borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', background: isToday ? theme.primary : 'transparent', color: isToday ? 'white' : 'inherit', padding: '2px 6px', borderRadius: '10px' }}>{i}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
            {acts.map((act, idx) => (
              <div key={idx} style={{ height: '4px', width: '100%', background: getTypeColor(act.type), borderRadius: '2px', opacity: 0.8 }} />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div style={{ background: theme.cardBg, padding: '16px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', textAlign: 'center', fontSize: '12px', opacity: 0.5 }}>
          <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>{days}</div>
      </div>
    );
  };

  return (
    <div style={appStyle}>
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>運動紀錄</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setTempCreds(stravaCredentials); setShowSettings(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: theme.cardBg, boxShadow: theme.shadow, borderBottom: theme.border, zIndex: 10 }}>
        <div style={{ display: 'flex', background: theme.secondary, borderRadius: '24px', padding: '4px' }}>
          <button onClick={() => setCurrentTab('overview')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: 'none', background: currentTab === 'overview' ? theme.cardBg : 'transparent', color: currentTab === 'overview' ? theme.primary : theme.text, fontWeight: 'bold', fontSize: '14px' }}>總覽</button>
          <button onClick={() => setCurrentTab('calendar')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: 'none', background: currentTab === 'calendar' ? theme.cardBg : 'transparent', color: currentTab === 'calendar' ? theme.primary : theme.text, fontWeight: 'bold', fontSize: '14px' }}>行事曆</button>
        </div>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {!isConfigured ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px', padding: '0 20px' }}>
            <div style={{ background: 'white', padding: '40px 30px', borderRadius: '32px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)', width: '100%', maxWidth: '380px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.02)' }}>
              {/* Alert Icon */}
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#fff5f5', marginBottom: '24px' }}>
                <AlertCircle size={48} color="#f87171" strokeWidth={1.5} />
              </div>
              
              {/* Title */}
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f766e', marginBottom: '16px', letterSpacing: '0.5px' }}>未設定 API 金鑰</h2>
              
              {/* Description */}
              <div style={{ marginBottom: '32px', lineHeight: '1.6' }}>
                <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>請先申請並設定</p>
                <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>「Strava」API Key</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>本功能需授權讀取您的運動紀錄。</p>
              </div>

              {/* Primary Action */}
              <button 
                onClick={() => setShowSettings(true)} 
                style={{ width: '100%', padding: '16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', marginBottom: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(34, 197, 94, 0.2)' }}
              >
                前往設定
              </button>

              {/* Secondary Link */}
              <button 
                onClick={() => window.open('https://www.strava.com/settings/api', '_blank')} 
                style={{ background: 'none', border: 'none', color: '#22c55e', fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                前往 Strava 官網 <RefreshCw size={14} style={{ opacity: 0.8 }} />
              </button>
            </div>
          </div>
        ) : !hasRefreshToken ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <Activity size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ opacity: 0.6, marginBottom: '20px' }}>請授權讀取 Strava 紀錄</p>
            <a href={`https://www.strava.com/oauth/authorize?client_id=${stravaCredentials.clientId}&response_type=code&redirect_uri=${window.location.origin}/sport&approval_prompt=force&scope=read,activity:read_all`} style={{ display: 'inline-block', padding: '12px 24px', background: '#fc4c02', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}>授權登入</a>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={handlePrevMonth} style={{ background: theme.secondary, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text }}><ChevronLeft size={18} /></button>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{currentYear}年 {currentMonth + 1}月</h2>
              <button onClick={handleNextMonth} style={{ background: theme.secondary, border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text }}><ChevronRight size={18} /></button>
            </div>

            {currentTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: theme.cardBg, padding: '16px 8px', textAlign: 'center', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>跑步</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e11d48' }}>{(monthRunMeters / 1000).toFixed(1)}</div>
                  <div style={{ fontSize: '10px', opacity: 0.5 }}>km</div>
                </div>
                <div style={{ background: theme.cardBg, padding: '16px 8px', textAlign: 'center', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>騎車</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{(monthRideMeters / 1000).toFixed(1)}</div>
                  <div style={{ fontSize: '10px', opacity: 0.5 }}>km</div>
                </div>
                <div style={{ background: theme.cardBg, padding: '16px 8px', textAlign: 'center', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
                  <div style={{ fontSize: '11px', opacity: 0.6 }}>重訓</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9333ea' }}>{(monthWeightTrainingSeconds / 3600).toFixed(1)}</div>
                  <div style={{ fontSize: '10px', opacity: 0.5 }}>hrs</div>
                </div>
              </div>
            )}

            {currentTab === 'calendar' && renderCalendar()}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', opacity: 0.7 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedCalendarDate ? `${selectedCalendarDate.getDate()}日活動` : '本月動態'}</h3>
              <button onClick={() => fetchActivities(1, false)} style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={14} className={isLoading ? "spin" : ""} /> 更新</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visibleActivities.map(act => (
                <div key={act.id} style={{ background: theme.cardBg, padding: '16px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: getTypeColor(act.type) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: getTypeColor(act.type) }}>
                    {getTypeIcon(act.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{act.name}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', background: getTypeColor(act.type) + '15', color: getTypeColor(act.type), padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>{getTypeLabel(act.type)}</span>
                      <span style={{ fontSize: '12px', opacity: 0.6 }}>{new Date(act.start_date_local).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: getTypeColor(act.type) }}>{act.distance > 0 ? (act.distance / 1000).toFixed(2) + ' km' : formatDuration(act.moving_time)}</div>
                  </div>
                </div>
              ))}
              {visibleActivities.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px 0' }}>尚無活動紀錄</div>}
              {filteredActivities.length > displayCount && <button onClick={() => setDisplayCount(prev => prev + 10)} style={{ width: '100%', padding: '12px', background: theme.secondary, border: 'none', borderRadius: '12px', color: theme.text, fontWeight: 'bold' }}>載入更多</button>}
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>運動紀錄設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button key={key} onClick={() => setSportSettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: sportSettings?.theme === key ? theme.primary : theme.secondary, color: sportSettings?.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid ' + theme.secondary, paddingTop: '16px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold' }}>Strava API</h4>
              <button
                type="button"
                onClick={() => window.open('https://www.strava.com/settings/api', '_blank')}
                style={{ fontSize: '11px', background: '#fc4c0220', color: '#fc4c02', border: 'none', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}
              >
                取得金鑰
              </button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <input value={tempCreds.clientId} onChange={e => setTempCreds({ ...tempCreds, clientId: e.target.value })} placeholder="Client ID" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', marginBottom: '10px' }} />
              <input type="password" value={tempCreds.clientSecret} onChange={e => setTempCreds({ ...tempCreds, clientSecret: e.target.value })} placeholder="Client Secret" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', marginBottom: '20px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: theme.primary, color: 'white', fontWeight: 'bold', border: 'none' }}>儲存</button>
                <button type="button" onClick={() => { setStravaCredentials({ clientId: '', clientSecret: '', refreshToken: '' }); setStravaActivities([]); setShowSettings(false); }} style={{ padding: '12px', borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none' }}>登出</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}
