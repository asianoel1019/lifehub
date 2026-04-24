import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  ArrowLeft, RefreshCw, MapPin, Bike, Navigation, Settings, X, AlertCircle, ExternalLink, Loader2
} from 'lucide-react';
import { useStore } from '../store/useStore';
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
    mapTile: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
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
    mapTile: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
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
    mapTile: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
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
    mapTile: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  }
};

// TDX City codes with approximate center coordinates for GPS-to-city mapping
const TAIWAN_CITIES = [
  { code: 'Taipei', name: '臺北市', lat: 25.0330, lon: 121.5654 },
  { code: 'NewTaipei', name: '新北市', lat: 25.0120, lon: 121.4650 },
  { code: 'Taoyuan', name: '桃園市', lat: 24.9936, lon: 121.3010 },
  { code: 'Taichung', name: '臺中市', lat: 24.1477, lon: 120.6736 },
  { code: 'Tainan', name: '臺南市', lat: 22.9998, lon: 120.2270 },
  { code: 'Kaohsiung', name: '高雄市', lat: 22.6273, lon: 120.3014 },
  { code: 'Keelung', name: '基隆市', lat: 25.1276, lon: 121.7392 },
  { code: 'Hsinchu', name: '新竹市', lat: 24.8138, lon: 120.9675 },
  { code: 'HsinchuCounty', name: '新竹縣', lat: 24.8387, lon: 121.0178 },
  { code: 'MiaoliCounty', name: '苗栗縣', lat: 24.5602, lon: 120.8214 },
  { code: 'ChanghuaCounty', name: '彰化縣', lat: 24.0518, lon: 120.5161 },
  { code: 'NantouCounty', name: '南投縣', lat: 23.9610, lon: 120.6847 },
  { code: 'YunlinCounty', name: '雲林縣', lat: 23.7092, lon: 120.4313 },
  { code: 'ChiayiCounty', name: '嘉義縣', lat: 23.4518, lon: 120.2551 },
  { code: 'Chiayi', name: '嘉義市', lat: 23.4801, lon: 120.4491 },
  { code: 'PingtungCounty', name: '屏東縣', lat: 22.5519, lon: 120.5487 },
  { code: 'YilanCounty', name: '宜蘭縣', lat: 24.7021, lon: 121.7378 },
  { code: 'HualienCounty', name: '花蓮縣', lat: 23.9872, lon: 121.6016 },
  { code: 'TaitungCounty', name: '臺東縣', lat: 22.7583, lon: 121.1444 },
  { code: 'KinmenCounty', name: '金門縣', lat: 24.4493, lon: 118.3767 },
  { code: 'PenghuCounty', name: '澎湖縣', lat: 23.5711, lon: 119.5793 },
  { code: 'LienchiangCounty', name: '連江縣', lat: 26.1505, lon: 119.9499 },
];

const getCityFromCoords = (lat, lon) => {
  let minDist = Infinity;
  let best = TAIWAN_CITIES[0];
  for (const city of TAIWAN_CITIES) {
    const d = Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2);
    if (d < minDist) { minDist = d; best = city; }
  }
  return best;
};

export default function UbikeApp() {
  const navigate = useNavigate();
  const { 
    ubikeSettings, setUbikeSettings, 
    tdxCredentials, setTdxCredentials 
  } = useStore();
  const theme = themes[ubikeSettings?.theme] || themes.forest;
  
  const [mapRef, setMapRef] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempCreds, setTempCreds] = useState(tdxCredentials);

  // Location state
  const [userPos, setUserPos] = useState(null); // [lat, lon]
  const [detectedCity, setDetectedCity] = useState(null);
  const [locating, setLocating] = useState(false);

  const isConfigured = tdxCredentials.clientId && tdxCredentials.clientSecret;

  const getValidToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', tdxCredentials.clientId);
    params.append('client_secret', tdxCredentials.clientSecret);
    const res = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'TDX 授權失敗');
    setTdxCredentials({ ...tdxCredentials, accessToken: data.access_token });
    return data.access_token;
  };

  const fetchUbikeData = async (lat, lon, cityCode) => {
    if (!cityCode) return;
    setLoading(true);
    setError('');
    
    try {
      let token = tdxCredentials.accessToken || await getValidToken();
      
      // Fetch Stations and Availability in parallel
      const headers = { 'Authorization': `Bearer ${token}` };
      const stationUrl = `https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/${cityCode}?$format=JSON`;
      const availUrl = `https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/${cityCode}?$format=JSON`;

      const [stationRes, availRes] = await Promise.all([
        fetch(stationUrl, { headers }),
        fetch(availUrl, { headers })
      ]);

      if (stationRes.status === 401 || availRes.status === 401) {
        token = await getValidToken();
        const retryHeaders = { 'Authorization': `Bearer ${token}` };
        const [s2, a2] = await Promise.all([
          fetch(stationUrl, { headers: retryHeaders }),
          fetch(availUrl, { headers: retryHeaders })
        ]);
        // Use retry results if failed once
        processResponses(s2, a2);
      } else {
        await processResponses(stationRes, availRes);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || '取得資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const processResponses = async (sRes, aRes) => {
    if (!sRes.ok) throw new Error(`站點資料取得失敗 (${sRes.status})`);
    if (!aRes.ok) throw new Error(`即時位能取得失敗 (${aRes.status})`);

    const sData = await sRes.json();
    const aData = await aRes.json();

    const stationsArr = Array.isArray(sData) ? sData : (sData.value || []);
    const availArr = Array.isArray(aData) ? aData : (aData.value || []);

    // Create a map for availability
    const availMap = {};
    availArr.forEach(a => {
      availMap[a.StationUID] = a;
    });

    const merged = stationsArr.map(s => {
      const avail = availMap[s.StationUID] || {};
      return {
        id: s.StationID,
        uid: s.StationUID,
        name: s.StationName?.Zh_tw?.replace('YouBike2.0_', '') || '未知站點',
        lat: s.StationPosition?.PositionLat,
        lon: s.StationPosition?.PositionLon,
        address: s.StationAddress?.Zh_tw || '',
        bikes: avail.AvailableRentBikes ?? 0,
        generalBikes: avail.AvailableRentBikesDetail?.GeneralBikes ?? 0,
        electricBikes: avail.AvailableRentBikesDetail?.ElectricBikes ?? 0,
        spaces: avail.AvailableReturnBikes ?? avail.AvailableReturnSpaces ?? 0,
        status: avail.ServiceStatus ?? 0, 
        updateTime: avail.SrcUpdateTime ? new Date(avail.SrcUpdateTime).toLocaleTimeString() : ''
      };
    }).filter(s => s.lat && s.lon);

    setStations(merged);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援定位功能');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        const city = getCityFromCoords(latitude, longitude);
        setDetectedCity(city);
        setLocating(false);
        if (mapRef) mapRef.flyTo([latitude, longitude], 15);
        if (isConfigured) fetchUbikeData(latitude, longitude, city.code);
      },
      () => {
        setLocating(false);
        setError('定位失敗，請確認權限');
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (isConfigured) {
      locateMe();
    }
  }, [isConfigured]);

  const createIcon = (station) => {
    const isEmpty = station.bikes === 0;
    const isFull = station.spaces === 0;
    const isOffline = station.status !== 1;
    
    let color = '#10b981'; // Green
    if (isOffline) color = '#9ca3af'; // Gray
    else if (isEmpty) color = '#ef4444'; // Red
    else if (isFull) color = '#f59e0b'; // Orange

    return L.divIcon({
      className: 'custom-ubike-marker',
      html: `<div style="background-color: ${color}; color: white; width: 30px; height: 30px; border-radius: ${theme.radius === '0px' ? '0' : '50%'}; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); opacity: ${isOffline ? 0.6 : 1}">
        ${isOffline ? '✖' : station.bikes}
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setTdxCredentials(tempCreds);
    setShowSettings(false);
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.3s ease' }}>
      <style>{`
        .leaflet-container { background: ${theme.bg}; font-family: inherit; }
        .leaflet-popup-content-wrapper { background: ${theme.cardBg} !important; color: ${theme.text} !important; border-radius: ${theme.radius} !important; border: ${theme.border} !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .leaflet-popup-tip { background: ${theme.cardBg} !important; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border, zIndex: 1001 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1.2 }}>YouBike 2.0</h1>
            {detectedCity && <span style={{ fontSize: '10px', opacity: 0.8 }}>{detectedCity.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => userPos && fetchUbikeData(userPos[0], userPos[1], detectedCity?.code)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isConfigured ? (
          /* API Key Setup Prompt - Redesigned UI */
          <div style={{ position: 'absolute', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: theme.bg }}>
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
                <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>「TDX 運輸資料流通服務平臺」 API Key</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>本功能將共用車票、停車 App 的金鑰。</p>
              </div>

              {/* Primary Action */}
              <button 
                onClick={() => setShowSettings(true)} 
                style={{ width: '100%', padding: '16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '16px', marginBottom: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(34, 197, 94, 0.2)' }}
              >
                前往設定
              </button>

              {/* Secondary Link */}
              <a 
                href="https://tdx.transportdata.tw/" 
                target="_blank" 
                rel="noreferrer"
                style={{ background: 'none', border: 'none', color: '#22c55e', fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', justifyContent: 'center', width: '100%' }}
              >
                前往 TDX 官網 <ExternalLink size={14} style={{ opacity: 0.8 }} />
              </a>
            </div>
          </div>
        ) : (
          <>
            <MapContainer 
              ref={setMapRef}
              center={[25.0339, 121.5644]} 
              zoom={14} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={false}
            >
              <TileLayer url={theme.mapTile} />
              {stations.map(station => (
                <Marker key={station.uid} position={[station.lat, station.lon]} icon={createIcon(station)}>
                  <Popup closeButton={false}>
                    <div style={{ minWidth: '180px', padding: '4px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid ' + theme.secondary, paddingBottom: '8px', marginBottom: '8px' }}>
                          {station.name}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>可借車輛</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: station.bikes === 0 ? '#ef4444' : theme.primary }}>{station.bikes}</div>
                            <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px' }}>
                              (單:{station.generalBikes} 電:{station.electricBikes})
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>可還空位</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: station.spaces === 0 ? '#f59e0b' : theme.text }}>{station.spaces}</div>
                          </div>
                        </div>
                      <div style={{ fontSize: '10px', opacity: 0.5, borderTop: '1px solid ' + theme.secondary, paddingTop: '4px', textAlign: 'center' }}>
                        更新: {station.updateTime}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {userPos && (
                <Marker position={userPos} icon={L.divIcon({
                  className: 'user-pos-marker',
                  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.6)"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })} />
              )}
            </MapContainer>

            {/* Error Overlay */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 1000, background: 'rgba(239,68,68,0.95)', color: 'white', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Controls */}
            <div style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={locateMe}
                style={{
                  background: theme.cardBg, border: theme.border || 'none', padding: '12px',
                  borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: theme.primary, cursor: 'pointer'
                }}
              >
                {locating ? <Loader2 size={24} className="spin" /> : <Navigation size={24} />}
              </button>
            </div>

            {/* Legend */}
            <div style={{ 
              position: 'absolute', bottom: '24px', left: '16px', zIndex: 1000, 
              background: theme.cardBg, border: theme.border || 'none', padding: '10px 14px', 
              borderRadius: theme.radius, display: 'flex', flexDirection: 'column', gap: '6px',
              boxShadow: theme.shadow || '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', color: theme.text
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> 正常借還</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> 車輛用盡</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} /> 站點滿位</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9ca3af' }} /> 暫停營運</div>
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '380px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>YouBike 設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X /></button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block', opacity: 0.7 }}>介面風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button 
                    key={key} 
                    onClick={() => setUbikeSettings({ theme: key })} 
                    style={{ 
                      padding: '12px', borderRadius: '12px', border: 'none', 
                      background: ubikeSettings?.theme === key ? theme.primary : theme.secondary, 
                      color: ubikeSettings?.theme === key ? 'white' : theme.text, 
                      fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 'bold', borderTop: '1px solid ' + theme.secondary, paddingTop: '16px', marginBottom: '12px' }}>TDX API 金鑰</h4>
            <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '16px' }}>此金鑰將與所有交通類 App 共用。</p>
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  value={tempCreds.clientId} 
                  onChange={e => setTempCreds({...tempCreds, clientId: e.target.value})} 
                  placeholder="Client ID" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', boxSizing: 'border-box' }} 
                />
                <input 
                  type="password" 
                  value={tempCreds.clientSecret} 
                  onChange={e => setTempCreds({...tempCreds, clientSecret: e.target.value})} 
                  placeholder="Client Secret" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid ' + theme.secondary, background: theme.bg, color: 'inherit', boxSizing: 'border-box' }} 
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: theme.primary, color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>儲存設定</button>
                  <button type="button" onClick={() => { setTdxCredentials({ clientId:'', clientSecret:'', accessToken:'' }); setTempCreds({ clientId:'', clientSecret:'', accessToken:'' }); }} style={{ padding: '14px', borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>清除</button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
