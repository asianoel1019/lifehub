import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, TrainFront, Settings, ArrowRightLeft, Search, 
  Clock, AlertCircle, Calendar, X, ChevronRight, ExternalLink,
  RefreshCw
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

const REGIONS = {
  north: { name: '北部地區', keywords: ['台北', '臺北', '基隆', '新北', '桃園', '新竹'] },
  central: { name: '中部地區', keywords: ['苗栗', '台中', '臺中', '彰化', '南投', '雲林'] },
  south: { name: '南部地區', keywords: ['嘉義', '台南', '臺南', '高雄', '屏東'] },
  east: { name: '東部地區', keywords: ['宜蘭', '花蓮', '台東', '臺東'] }
};

export default function TraApp() {
  const navigate = useNavigate();
  const { 
    tdxCredentials, setTdxCredentials, traStations, setTraStations,
    traSettings, setTraSettings
  } = useStore();
  
  const theme = themes[traSettings?.theme] || themes.forest;
  
  const [showSettings, setShowSettings] = useState(false);
  const [tempCreds, setTempCreds] = useState(tdxCredentials);
  const [origin, setOrigin] = useState(traSettings?.defaultOrigin || '');
  const [destination, setDestination] = useState(traSettings?.defaultDestination || '');
  const [originRegion, setOriginRegion] = useState('');
  const [destRegion, setDestRegion] = useState('');
  const [allDaySchedules, setAllDaySchedules] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [liveDelays, setLiveDelays] = useState({}); // { TrainNo: DelayTime }
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Custom Time Picker States (24H)
  const [timeHour, setTimeHour] = useState(() => new Date().getHours());
  const [timeMin, setTimeMin] = useState(() => new Date().getMinutes() >= 30 ? '30' : '00');
  const [filterMode, setFilterMode] = useState('dep'); // 'dep' | 'arr'

  const isConfigured = tdxCredentials.clientId && tdxCredentials.clientSecret;

  useEffect(() => {
    // Force re-fetch if existing data is missing city info
    const needsUpdate = traStations.length > 0 && !traStations[0].city;
    if (isConfigured && (traStations.length === 0 || needsUpdate)) {
      fetchAllStations();
    }
  }, [isConfigured]); // Only run when configured or manually triggered

  // Persistent settings sync
  useEffect(() => {
    if (origin || destination) {
      setTraSettings({ defaultOrigin: origin, defaultDestination: destination });
    }
  }, [origin, destination]);

  // Initial region detection
  useEffect(() => {
    if (traStations.length > 0) {
      if (origin && !originRegion) {
        const s = traStations.find(x => x.id === origin);
        if (s) setOriginRegion(Object.keys(REGIONS).find(k => REGIONS[k].keywords.some(kw => s.city?.includes(kw))) || '');
      }
      if (destination && !destRegion) {
        const s = traStations.find(x => x.id === destination);
        if (s) setDestRegion(Object.keys(REGIONS).find(k => REGIONS[k].keywords.some(kw => s.city?.includes(kw))) || '');
      }
    }
  }, [traStations, origin, destination]);

  // Local filtering logic with dynamic window
  useEffect(() => {
    if (allDaySchedules.length === 0) return;
    
    // 24H total minutes
    const qTotal = parseInt(timeHour) * 60 + parseInt(timeMin);

    // Smart window: Dep (-30/+120), Arr (-120/+30)
    let windowMin, windowMax;
    if (filterMode === 'dep') {
      windowMin = qTotal - 30;
      windowMax = qTotal + 120;
    } else {
      windowMin = qTotal - 120;
      windowMax = qTotal + 30;
    }

    const filtered = allDaySchedules.filter(t => {
      const timeStr = filterMode === 'dep' ? t.dep : t.arr;
      const [h, m] = timeStr.split(':').map(Number);
      let total = h * 60 + m;
      return total >= windowMin && total <= windowMax;
    });

    setSchedules(filtered.sort((a, b) => a.dep.localeCompare(b.dep)));
  }, [allDaySchedules, timeHour, timeMin, filterMode]);

  const getValidToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', tdxCredentials.clientId);
    params.append('client_secret', tdxCredentials.clientSecret);
    const res = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || '無法授權');
    setTdxCredentials({ ...tdxCredentials, accessToken: data.access_token });
    return data.access_token;
  };

  const fetchAllStations = async () => {
    try {
      const token = await getValidToken();
      const res = await fetch('https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/Station?$format=JSON', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      const stations = data.Stations.map(s => {
        // Use binary city detection: LocationCity OR Regex match from StationAddress
        const cityMatch = (s.StationAddress || '').match(/(臺北|台北|基隆|新北|桃園|新竹|苗栗|台中|臺中|彰化|南投|雲林|嘉義|台南|臺南|高雄|屏東|宜蘭|花蓮|台東|臺東)/);
        const city = s.LocationCity || (cityMatch ? cityMatch[0] : '');
        return { 
          id: s.StationID, 
          name: s.StationName.Zh_tw,
          city: city
        };
      });
      setTraStations(stations);
      
      if (stations.length >= 2 && !origin && !destination) {
        setOrigin(stations.find(s => s.name === '臺北')?.id || stations[0].id);
        setDestination(stations.find(s => s.name === '臺中')?.id || stations[1].id);
      }
    } catch (e) { 
      console.error(e); 
      setErrorMsg('站點資料載入失敗，請檢查 API Key 權限');
    }
  };

  const swapStations = () => {
    const t = origin;
    setOrigin(destination);
    setDestination(t);
  };

  const searchTrains = async () => {
    if (!isConfigured) return setShowSettings(true);
    if (!origin || !destination) return setErrorMsg('請選擇起迄站');
    setErrorMsg('');
    setIsLoading(true);
    setHasSearched(true);
    
    // Fetch live delays (Use V2 as V3 global delay is often unstable/404)
    try {
      let token = tdxCredentials.accessToken || await getValidToken();
      const delayRes = await fetch(`https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/LiveTrainDelay?$format=JSON`, { headers: { 'Authorization': `Bearer ${token}` } });
      const delayData = await delayRes.json();
      const delayMap = {};
      if (Array.isArray(delayData)) {
        delayData.forEach(d => {
          delayMap[d.TrainNo] = d.DelayTime;
        });
      }
      setLiveDelays(delayMap);
    } catch (e) { console.error('Delay fetch failed', e); }

    try {
      let token = tdxCredentials.accessToken || await getValidToken();
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const res = await fetch(`https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/DailyTrainTimetable/OD/${origin}/to/${destination}/${dateString}?$format=JSON`, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (res.status === 401) {
         token = await getValidToken();
         const retryRes = await fetch(`https://tdx.transportdata.tw/api/basic/v3/Rail/TRA/DailyTrainTimetable/OD/${origin}/to/${destination}/${dateString}?$format=JSON`, { headers: { 'Authorization': `Bearer ${token}` } });
         const data = await retryRes.json();
         if (!retryRes.ok) throw new Error(data.message || '查詢失敗');
         processTrainData(data);
      } else {
         const data = await res.json();
         if (!res.ok) throw new Error(data.message || '查詢失敗');
         processTrainData(data);
      }
    } catch (err) { setErrorMsg(err.message); }
    finally { setIsLoading(false); }
  };

  const processTrainData = (data) => {
    const list = data.TrainTimetables || (Array.isArray(data) ? data : null);
    if (!list || list.length === 0) {
      setAllDaySchedules([]);
      setSchedules([]);
      return;
    }
    
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    let formatted = list
      .map(t => {
        const originStop = t.OriginStopTime || (t.StopTimes && t.StopTimes[0]);
        const destStop = t.DestinationStopTime || (t.StopTimes && t.StopTimes[1]);
        if (!originStop || !destStop) return null;
        const dep = originStop.DepartureTime || '';
        const arr = destStop.ArrivalTime || '';
        const depParts = dep.split(':').map(Number);
        const arrParts = arr.split(':').map(Number);
        let durStr = '--';
        if (depParts.length >= 2 && arrParts.length >= 2) {
          let dur = (arrParts[0]*60 + arrParts[1]) - (depParts[0]*60 + depParts[1]);
          if (dur < 0) dur += 1440;
          durStr = `${Math.floor(dur/60)}h${dur%60}m`;
        }
        return {
          no: t.TrainInfo?.TrainNo || 'N/A',
          type: t.TrainInfo?.TrainTypeName?.Zh_tw || '車次',
          dep: dep.slice(0, 5),
          arr: arr.slice(0, 5),
          dur: durStr,
          passed: depParts.length >= 2 ? (depParts[0]*60 + depParts[1]) < now : false
        };
      })
      .filter(i => i !== null);

    setAllDaySchedules(formatted);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setTdxCredentials(tempCreds);
    setShowSettings(false);
  };

  const appStyle = {
    backgroundColor: theme.bg, color: theme.text, minHeight: '100dvh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease'
  };

  return (
    <div style={appStyle}>
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>台鐵時刻表</h1>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={18} /></button>
      </div>

      {/* Station Selection Block (Ultra Compact Single Row) */}
      <div style={{ background: theme.cardBg, padding: '12px 16px', boxShadow: theme.shadow, borderBottom: theme.border, zIndex: 10, opacity: isConfigured ? 1 : 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: theme.bg, borderRadius: '12px', padding: '6px', border: '1px solid ' + theme.secondary, marginBottom: '12px' }}>
          {/* Origin Group */}
          <div style={{ display: 'flex', flex: 1, gap: '4px', minWidth: 0 }}>
            <select disabled={!isConfigured} value={originRegion} onChange={e => setOriginRegion(e.target.value)} style={{ width: '50px', padding: '4px', borderRadius: '6px', border: 'none', background: theme.secondary, color: theme.text, fontSize: '11px', fontWeight: 'bold' }}>
              <option value="" style={{ background: theme.cardBg, color: theme.text }}>域</option>
              {Object.entries(REGIONS).map(([k, r]) => <option key={k} value={k} style={{ background: theme.cardBg, color: theme.text }}>{r.name.substring(0, 2)}</option>)}
            </select>
            <select disabled={!isConfigured} value={origin} onChange={e => setOrigin(e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: theme.text, fontWeight: 'bold', fontSize: '13px', minWidth: 0 }}>
              <option value="" style={{ background: theme.cardBg, color: theme.text }}>出發</option>
              {traStations.filter(s => {
                if (originRegion === 'other') return !Object.values(REGIONS).some(r => r.keywords.some(k => s.city?.includes(k)));
                return originRegion ? REGIONS[originRegion].keywords.some(k => s.city?.includes(k)) : true;
              }).map(s => <option key={s.id} value={s.id} style={{ background: theme.cardBg, color: theme.text }}>{s.name}</option>)}
            </select>
          </div>

          {/* Swap Button */}
          <button disabled={!isConfigured} onClick={swapStations} style={{ background: theme.primary, border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <ArrowRightLeft size={12} />
          </button>

          {/* Destination Group */}
          <div style={{ display: 'flex', flex: 1, gap: '4px', minWidth: 0 }}>
            <select disabled={!isConfigured} value={destRegion} onChange={e => setDestRegion(e.target.value)} style={{ width: '50px', padding: '4px', borderRadius: '6px', border: 'none', background: theme.secondary, color: theme.text, fontSize: '11px', fontWeight: 'bold' }}>
              <option value="" style={{ background: theme.cardBg, color: theme.text }}>域</option>
              {Object.entries(REGIONS).map(([k, r]) => <option key={k} value={k} style={{ background: theme.cardBg, color: theme.text }}>{r.name.substring(0, 2)}</option>)}
            </select>
            <select disabled={!isConfigured} value={destination} onChange={e => setDestination(e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: theme.text, fontWeight: 'bold', fontSize: '13px', minWidth: 0 }}>
              <option value="" style={{ background: theme.cardBg, color: theme.text }}>到達</option>
              {traStations.filter(s => {
                if (destRegion === 'other') return !Object.values(REGIONS).some(r => r.keywords.some(k => s.city?.includes(k)));
                return destRegion ? REGIONS[destRegion].keywords.some(k => s.city?.includes(k)) : true;
              }).map(s => <option key={s.id} value={s.id} style={{ background: theme.cardBg, color: theme.text }}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* 24H Time Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) 2fr', gap: '8px', marginBottom: '8px' }}>
          <select value={timeHour} onChange={e => setTimeHour(e.target.value)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.bg, color: theme.text, fontSize: '13px', fontWeight: 'bold' }}>
            {Array.from({length: 24}).map((_, h) => <option key={h} value={h} style={{ background: theme.cardBg, color: theme.text }}>{String(h).padStart(2, '0')} 時</option>)}
          </select>
          <select value={timeMin} onChange={e => setTimeMin(e.target.value)} style={{ padding: '8px', borderRadius: '10px', border: '1px solid ' + theme.secondary, background: theme.bg, color: theme.text, fontSize: '13px', fontWeight: 'bold' }}>
            <option value="00" style={{ background: theme.cardBg, color: theme.text }}>00 分</option>
            <option value="30" style={{ background: theme.cardBg, color: theme.text }}>30 分</option>
          </select>

          <div style={{ display: 'flex', background: theme.secondary, borderRadius: '10px', padding: '3px' }}>
            <button onClick={() => setFilterMode('dep')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', background: filterMode === 'dep' ? theme.primary : 'transparent', color: filterMode === 'dep' ? 'white' : 'inherit', fontSize: '12px', fontWeight: 'bold' }}>出發</button>
            <button onClick={() => setFilterMode('arr')} style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', background: filterMode === 'arr' ? theme.primary : 'transparent', color: filterMode === 'arr' ? 'white' : 'inherit', fontSize: '12px', fontWeight: 'bold' }}>抵達</button>
          </div>
        </div>

        <button disabled={!isConfigured} onClick={searchTrains} style={{ width: '100%', padding: '10px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}>
          {isLoading ? <><RefreshCw size={16} className="spin" /> 查詢中</> : <><Search size={16} /> 查詢班次 ({filterMode === 'dep' ? '-30/+120' : '-120/+30'}m)</>}
        </button>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {!isConfigured ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: theme.cardBg, borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>未設定 API 金鑰</h2>
            <p style={{ opacity: 0.7, fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              請先申請並設定 <br/><strong>「TDX 運輸資料流通服務平臺」</strong> API Key <br/> 點擊右上角齒輪圖示進行設定，否則頁面將無法查詢時刻。
            </p>
            <button 
              onClick={() => setShowSettings(true)}
              style={{ padding: '12px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
            >
              立即設定
            </button>
            <a 
              href="https://tdx.transportdata.tw/" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', fontSize: '12px', color: theme.primary, textDecoration: 'none', fontWeight: 'bold' }}
            >
              前往 TDX 官網 <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <>
            {errorMsg && <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', display: 'flex', gap: '8px' }}><AlertCircle size={18} /> {errorMsg}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {schedules.map((t, i) => {
                const delay = liveDelays[t.no];
                const delayColor = delay === 0 ? '#16a34a' : (delay > 10 ? '#dc2626' : '#ca8a04');
                const delayText = delay === 0 ? '準點' : (delay !== undefined ? `晚 ${delay} 分` : '');

                return (
                  <div key={i} style={{ background: theme.cardBg, padding: '16px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, opacity: t.passed ? 0.4 : 1, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ background: theme.secondary, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', color: theme.primary }}>{t.type} {t.no}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {delayText && (
                          <span style={{ color: delayColor, fontSize: '11px', fontWeight: 'bold', background: delayColor + '20', padding: '2px 8px', borderRadius: '4px' }}>{delayText}</span>
                        )}
                        <span style={{ fontSize: '11px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {t.dur}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.dep}</div>
                        <div style={{ fontSize: '11px', opacity: 0.5 }}>出發</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ width: '100%', height: '2px', background: theme.secondary }} />
                        <ChevronRight size={16} style={{ position: 'absolute', right: 0, color: theme.secondary }} />
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{t.arr}</div>
                        <div style={{ fontSize: '11px', opacity: 0.5 }}>抵達</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {schedules.length === 0 && !isLoading && (
                <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.4 }}>
                  <TrainFront size={64} style={{ marginBottom: '16px' }} />
                  <p>{hasSearched ? "此時段已無更多班次或查無結果" : "尚未進行查詢"}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '360px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>台鐵查詢設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'block', opacity: 0.7 }}>介面風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button key={key} onClick={() => setTraSettings({ theme: key })} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: traSettings?.theme === key ? theme.primary : theme.secondary, color: traSettings?.theme === key ? 'white' : theme.text, fontSize: '13px', fontWeight: 'bold' }}>{t.name}</button>
                ))}
              </div>
            </div>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', borderTop: '1px solid ' + theme.secondary, paddingTop: '16px', marginBottom: '12px' }}>TDX API / 資料管理</h4>
            <div style={{ marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => fetchAllStations()} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.primary, background: 'transparent', color: theme.primary, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={14} /> 更新車站列表資料
              </button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <input value={tempCreds.clientId} onChange={e => setTempCreds({...tempCreds, clientId: e.target.value})} placeholder="Client ID" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', marginBottom: '10px' }} />
              <input type="password" value={tempCreds.clientSecret} onChange={e => setTempCreds({...tempCreds, clientSecret: e.target.value})} placeholder="Client Secret" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', marginBottom: '20px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: theme.primary, color: 'white', fontWeight: 'bold', border: 'none' }}>儲存</button>
                <button type="button" onClick={() => { setTdxCredentials({ clientId:'', clientSecret:'', accessToken:'' }); setTraStations([]); setShowSettings(false); }} style={{ padding: '12px', borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none' }}>登出</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } } 
        .spin { animation: spin 1s linear infinite; }
        select option { background-color: ${theme.cardBg} !important; color: ${theme.text} !important; }
      `}</style>
    </div>
  );
}
