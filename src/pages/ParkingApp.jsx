import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, X, MapPin, Car, RefreshCw,
  AlertCircle, ExternalLink, Navigation, ChevronDown, ChevronUp,
  Map, List, Loader2
} from 'lucide-react';

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

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function ParkingApp() {
  const navigate = useNavigate();
  const {
    tdxCredentials, setTdxCredentials,
    parkingSettings, setParkingSettings
  } = useStore();
  const theme = themes[parkingSettings?.theme] || themes.forest;

  const [showSettings, setShowSettings] = useState(false);
  const [tempCreds, setTempCreds] = useState(tdxCredentials);

  const [mapRef, setMapRef] = useState(null);
  const [userLat, setUserLat] = useState(null);
  const [userLon, setUserLon] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [searchRadius, setSearchRadius] = useState(500);
  const [detectedCity, setDetectedCity] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  const isConfigured = tdxCredentials.clientId && tdxCredentials.clientSecret;

  useEffect(() => {
    if (isConfigured) locateMe();
  }, [isConfigured]);

  const locateMe = () => {
    if (!navigator.geolocation) { setLocError('您的瀏覽器不支援定位功能'); return; }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLat(lat);
        setUserLon(lon);
        const city = getCityFromCoords(lat, lon);
        setDetectedCity(city);
        setLocating(false);
        if (mapRef) mapRef.flyTo([lat, lon], 15);
        fetchParking(lat, lon, searchRadius, city.code);
      },
      (err) => {
        setLocating(false);
        setLocError('定位失敗，請確認權限');
        // Fallback to a default city if geolocation fails
        if (!detectedCity) {
          const defaultCity = TAIWAN_CITIES[0]; // Taipei
          setDetectedCity(defaultCity);
          setUserLat(defaultCity.lat);
          setUserLon(defaultCity.lon);
          fetchParking(defaultCity.lat, defaultCity.lon, searchRadius, defaultCity.code);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleCityChange = (e) => {
    const cityCode = e.target.value;
    const city = TAIWAN_CITIES.find(c => c.code === cityCode);
    if (city) {
      setDetectedCity(city);
      setUserLat(city.lat);
      setUserLon(city.lon);
      if (mapRef) mapRef.flyTo([city.lat, city.lon], 15);
      fetchParking(city.lat, city.lon, searchRadius, city.code);
    }
  };

  const getValidToken = async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', tdxCredentials.clientId);
    params.append('client_secret', tdxCredentials.clientSecret);
    const res = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || '無法授權');
    setTdxCredentials({ ...tdxCredentials, accessToken: data.access_token });
    return data.access_token;
  };

  const fetchParking = async (lat, lon, radius, cityCode) => {
    setLoading(true);
    setError('');
    setParkingLots([]);

    const city = cityCode || detectedCity?.code || getCityFromCoords(lat, lon).code;

    try {
      let token = tdxCredentials.accessToken || await getValidToken();

      // 1. CarPark descriptions
      const descUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/CarPark/City/${city}?$spatialFilter=nearby(${lat},${lon},${radius})&$top=30&$format=JSON`;
      let descRes = await fetch(descUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (descRes.status === 401) { token = await getValidToken(); descRes = await fetch(descUrl, { headers: { 'Authorization': `Bearer ${token}` } }); }
      if (!descRes.ok) throw new Error(`停車場資料取得失敗 (${descRes.status})`);
      const descData = await descRes.json();
      const carParks = Array.isArray(descData) ? descData : (descData.CarParks || descData.value || []);

      // 2. Availability
      const parkIds = new Set(carParks.map(d => d.CarParkID));
      const availUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/ParkingAvailability/City/${city}?$format=JSON`;
      let availMap = {};
      try {
        let availRes = await fetch(availUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        if (availRes.status === 401) { token = await getValidToken(); availRes = await fetch(availUrl, { headers: { 'Authorization': `Bearer ${token}` } }); }
        if (availRes.ok) {
          const availData = await availRes.json();
          const availArr = Array.isArray(availData) ? availData : (availData.ParkingAvailabilities || availData.value || []);
          availArr.forEach(a => {
            if (parkIds.has(a.CarParkID)) {
              availMap[a.CarParkID] = {
                availableCar: a.AvailableSpaces ?? a.CarSpaces?.AvailableSpaces ?? a.NumberOfAvailableSpaces ?? null,
                availableMotor: a.AvailableMotorSpaces ?? a.MotorSpaces?.AvailableSpaces ?? null,
              };
            }
          });
        }
      } catch (availErr) {
        console.warn('Availability fetch failed', availErr);
      }

      // 3. Combine
      const combined = carParks.map(d => {
        const pos = d.CarParkPosition || d.Position || {};
        const dLat = pos.PositionLat ?? pos.Lat;
        const dLon = pos.PositionLon ?? pos.Lon;
        const dist = (dLat && dLon) ? haversine(lat, lon, dLat, dLon) : null;
        const avail = availMap[d.CarParkID] || {};
        return {
          id: d.CarParkID,
          name: d.CarParkName?.Zh_tw || d.CarParkName || '未命名停車場',
          address: d.Address || '',
          lat: dLat, lon: dLon,
          distance: dist,
          totalCar: d.TotalOfCar ?? d.Spaces?.TotalOfCar ?? d.TotalSpace ?? null,
          totalMotor: d.TotalOfMotor ?? d.Spaces?.TotalOfMotor ?? null,
          availableCar: avail.availableCar,
          availableMotor: avail.availableMotor,
          fareDesc: d.FareDescription || ''
        };
      });

      combined.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
      setParkingLots(combined);
      if (combined.length === 0) {
        const radiusDisplay = radius >= 1000 ? `${radius/1000}km` : `${radius}m`;
        setError(`${detectedCity?.name || city} 半徑 ${radiusDisplay} 內未找到停車場`);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || '資料取得失敗');
    }
    setLoading(false);
  };

  const getAvailColor = (avail, total) => {
    if (avail === null || avail === undefined) return '#9ca3af';
    if (avail <= 0) return '#ef4444';
    if (total && avail / total < 0.2) return '#f59e0b';
    return '#22c55e';
  };

  const formatDistance = (m) => {
    if (m === null || m === undefined) return '--';
    return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
  };

  const openGoogleMaps = (lat, lon, name) => {
    const query = name ? encodeURIComponent(name) : `${lat},${lon}`;
    window.open(`https://www.google.com/maps/search/${query}/@${lat},${lon},17z`, '_blank');
  };

  const handleRefresh = () => {
    if (userLat && userLon) fetchParking(userLat, userLon, searchRadius, detectedCity?.code);
    else locateMe();
  };

  const handleSaveSettings = (e) => { e.preventDefault(); setTdxCredentials(tempCreds); setShowSettings(false); };

  const createMarkerIcon = (lot) => {
    const color = getAvailColor(lot.availableCar, lot.totalCar);
    const count = lot.availableCar !== null ? lot.availableCar : '?';
    
    return L.divIcon({
      className: 'parking-marker',
      html: `<div style="background-color: ${color}; color: white; width: 32px; height: 32px; border-radius: ${theme.radius === '0px' ? '0' : '50%'}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        ${count}
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const renderMapView = () => (
    <div style={{ width: '100%', height: 'calc(100% - 20px)', position: 'relative', marginBottom: '20px' }}>
      <MapContainer
        ref={setMapRef}
        center={[userLat || 25.0339, userLon || 121.5644]}
        zoom={searchRadius >= 2000 ? 13 : (searchRadius >= 1000 ? 14 : 15)}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer url={theme.mapTile} />
        {userLat && userLon && (
          <Marker position={[userLat, userLon]} icon={L.divIcon({
            className: 'user-marker',
            html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59,130,246,0.6)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })} />
        )}
        {parkingLots.map(lot => (
          <Marker key={lot.id} position={[lot.lat, lot.lon]} icon={createMarkerIcon(lot)}>
            <Popup closeButton={false}>
              <div style={{ minWidth: '180px', padding: '4px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: `1px solid ${theme.secondary}`, paddingBottom: '4px' }}>{lot.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '10px', opacity: 0.6 }}>汽車剩餘</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: getAvailColor(lot.availableCar, lot.totalCar) }}>{lot.availableCar ?? '--'}</div>
                  </div>
                  {lot.totalMotor > 0 && (
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '10px', opacity: 0.6 }}>機車剩餘</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: getAvailColor(lot.availableMotor, lot.totalMotor) }}>{lot.availableMotor ?? '--'}</div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <MapPin size={12} /> {lot.address}
                </div>
                <button
                  onClick={() => openGoogleMaps(lot.lat, lot.lon, lot.name)}
                  style={{ width: '100%', padding: '8px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Navigation size={12} /> 導航
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend overlay */}
      <div style={{ position: 'absolute', bottom: '24px', left: '16px', zIndex: 1000, background: theme.cardBg, padding: '8px 12px', borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} /> 充足</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> 稍擠</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> 額滿</div>
      </div>

      <button
        onClick={locateMe}
        style={{ position: 'absolute', bottom: '24px', right: '16px', zIndex: 1000, background: theme.cardBg, border: theme.border || 'none', padding: '12px', borderRadius: '50%', boxShadow: theme.shadow, color: theme.primary, cursor: 'pointer' }}
      >
        {locating ? <RefreshCw size={24} className="spin" /> : <Navigation size={24} />}
      </button>
    </div>
  );

  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {parkingLots.map(lot => {
        const isExpanded = expandedId === lot.id;
        const carColor = getAvailColor(lot.availableCar, lot.totalCar);
        const motorColor = getAvailColor(lot.availableMotor, lot.totalMotor);
        return (
          <motion.div key={lot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: theme.cardBg, borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, overflow: 'hidden' }}>
            <div onClick={() => setExpandedId(isExpanded ? null : lot.id)} style={{ padding: '16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lot.name}</h3>
                  <div style={{ fontSize: '12px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Navigation size={10} /> {formatDistance(lot.distance)}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: carColor + '18', borderRadius: '8px', flex: 1 }}>
                  <Car size={16} color={carColor} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: carColor, lineHeight: 1 }}>{lot.availableCar ?? '--'}</div>
                    <div style={{ fontSize: '10px', opacity: 0.6 }}>/ {lot.totalCar || '?'} 汽車</div>
                  </div>
                </div>
                {lot.totalMotor > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: motorColor + '18', borderRadius: '8px', flex: 1 }}>
                    <span style={{ fontSize: '16px' }}>🏍️</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: motorColor, lineHeight: 1 }}>{lot.availableMotor ?? '--'}</div>
                      <div style={{ fontSize: '10px', opacity: 0.6 }}>/ {lot.totalMotor || '?'} 機車</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${theme.secondary}`, paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', marginBottom: '8px', opacity: 0.7, display: 'flex', gap: '6px' }}><MapPin size={14} /> {lot.address}</div>
                    {lot.fareDesc && <div style={{ fontSize: '12px', marginBottom: '12px', opacity: 0.6, background: theme.secondary, padding: '8px 12px', borderRadius: '8px' }}>💰 {lot.fareDesc}</div>}
                    <button onClick={() => openGoogleMaps(lot.lat, lot.lon, lot.name)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                       <Navigation size={14} /> 導航
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, height: '100dvh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', overflow: 'hidden' }}>
      <style>{`
        .leaflet-container { background: ${theme.bg}; font-family: inherit; }
        .leaflet-popup-content-wrapper { background: ${theme.cardBg} !important; color: ${theme.text} !important; border-radius: ${theme.radius} !important; border: ${theme.border} !important; }
        .leaflet-popup-tip { background: ${theme.cardBg} !important; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border, zIndex: 1001 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>停車場在哪</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isConfigured && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '2px' }}>
              <button onClick={() => setViewMode('map')} style={{ padding: '6px', background: viewMode === 'map' ? 'white' : 'transparent', color: viewMode === 'map' ? theme.primary : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Map size={18} /></button>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? theme.primary : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><List size={18} /></button>
            </div>
          )}
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={18} /></button>
        </div>
      </div>

      {/* Main Content */}
      {!isConfigured ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <div style={{ background: theme.cardBg, padding: '12px 16px', borderBottom: theme.border, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: '8px', pointerEvents: 'none', opacity: 0.7 }} />
                  <select 
                    value={detectedCity?.code || ''} 
                    onChange={handleCityChange}
                    style={{ 
                      width: '100%', 
                      padding: '6px 8px 6px 28px', 
                      background: theme.secondary, 
                      color: theme.text, 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      fontWeight: 'bold',
                      appearance: 'none',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {!detectedCity && <option value="">定位中...</option>}
                    {TAIWAN_CITIES.map(city => (
                      <option key={city.code} value={city.code}>{city.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', opacity: 0.5 }} />
                </div>
                <button onClick={handleRefresh} style={{ padding: '6px 12px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} className={loading || locating ? 'spin' : ''} /> {loading ? '查詢中' : '刷新'}
                </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.6 }}>搜尋半徑:</span>
               {[300, 500, 1000, 2000].map(r => (
                 <button key={r} onClick={() => { setSearchRadius(r); fetchParking(userLat, userLon, r); }} style={{ padding: '6px 12px', borderRadius: '12px', border: 'none', background: searchRadius === r ? theme.primary : theme.secondary, color: searchRadius === r ? 'white' : theme.text, fontSize: '12px', fontWeight: 'bold' }}>
                   {r >= 1000 ? `${r/1000}km` : `${r}m`}
                 </button>
               ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: viewMode === 'list' ? 'auto' : 'hidden', padding: viewMode === 'list' ? '16px' : '0' }}>
            {error && <div style={{ background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            {viewMode === 'map' ? renderMapView() : renderListView()}
            {parkingLots.length === 0 && !loading && !error && (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                 <Car size={48} style={{ margin: '0 auto 16px' }} />
                 <p>附近沒有找到停車場</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '380px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 'bold' }}>應用設定</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>主題風格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(themes).map(([key, t]) => (
                  <button key={key} onClick={() => setParkingSettings({ theme: key })} style={{ padding: '12px', borderRadius: '12px', border: 'none', background: parkingSettings?.theme === key ? theme.primary : theme.secondary, color: parkingSettings?.theme === key ? 'white' : theme.text, fontWeight: 'bold' }}>{t.name}</button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input value={tempCreds.clientId} onChange={e => setTempCreds({...tempCreds, clientId: e.target.value})} placeholder="TDX Client ID" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.secondary}`, background: theme.bg, color: 'inherit' }} />
                <input type="password" value={tempCreds.clientSecret} onChange={e => setTempCreds({...tempCreds, clientSecret: e.target.value})} placeholder="TDX Client Secret" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.secondary}`, background: theme.bg, color: 'inherit' }} />
                <button type="submit" style={{ padding: '14px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>儲存</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
