import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, X, MapPin, Navigation, 
  Plus, Trash2, Edit2, Check, Clock, 
  Map as MapIcon, Image as ImageIcon, ExternalLink, RefreshCw,
  Search, ChevronRight, AlertCircle, Save
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

// Component to handle map center changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 16, {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  return null;
}

// Mini Map Snapshot Component to replace static images
function MapSnapshot({ lat, lng, theme, zoom = 17, style = {} }) {
  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url={theme.mapTile} />
        <Marker 
          position={[lat, lng]} 
          icon={L.divIcon({
            className: 'snapshot-marker',
            html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3)"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })} 
        />
      </MapContainer>
    </div>
  );
}

export default function WhereAmIApp() {
  const navigate = useNavigate();
  const {
    whereAmISettings, setWhereAmISettings,
    whereAmILocations, saveWhereAmILocation,
    deleteWhereAmILocation, renameWhereAmILocation
  } = useStore();
  
  const theme = themes[whereAmISettings?.theme] || themes.forest;
  
  const [showSettings, setShowSettings] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  
  // New state for recording workflow
  const [isNaming, setIsNaming] = useState(false);
  const [newName, setNewName] = useState('');
  
  // New state for custom confirmation and preview
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewLoc, setPreviewLoc] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  
  useEffect(() => {
    locateMe();
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援定位功能');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError('定位失敗，請確認權限');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveLocation = () => {
    if (!userPos) return;
    if (whereAmILocations.length >= 10) {
      showToast('最多只能儲存 10 個位置，請刪除舊的位置。', 'error');
      return;
    }
    setNewName(`位置 ${whereAmILocations.length + 1}`);
    setIsNaming(true);
  };

  const confirmSaveLocation = () => {
    // Using a keyless static map provider (Yandex) as a 'screenshot' of the map
    const staticMapUrl = `https://static-maps.yandex.ru/1.x/?ll=${userPos.lng},${userPos.lat}&z=17&l=map&size=600,450&pt=${userPos.lng},${userPos.lat},pm2rdm`;
    
    saveWhereAmILocation({
      name: newName || `位置 ${whereAmILocations.length + 1}`,
      lat: userPos.lat,
      lng: userPos.lng,
      streetViewUrl: staticMapUrl, // Reusing the field name for simplicity
      timestamp: new Date().toISOString()
    });
    
    setIsNaming(false);
    showToast('位置已儲存！');
  };

  const handleNavigate = (lat, lng, name) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const startEditing = (loc) => {
    setEditingId(loc.id);
    setEditName(loc.name);
  };

  const saveEdit = () => {
    if (editingId) {
      renameWhereAmILocation(editingId, editName);
      setEditingId(null);
    }
  };

  const formatDate = (isoStr) => {
    const date = new Date(isoStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const userMarkerIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.6)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const savedMarkerIcon = (color) => L.divIcon({
    className: 'saved-marker',
    html: `<div style="color: ${color};"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, height: '100dvh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', overflow: 'hidden' }}>
      <style>{`
        .leaflet-container { background: ${theme.bg}; font-family: inherit; }
        .leaflet-popup-content-wrapper { background: ${theme.cardBg} !important; color: ${theme.text} !important; border-radius: ${theme.radius} !important; border: ${theme.border} !important; padding: 0 !important; overflow: hidden; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: ${theme.cardBg} !important; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border, zIndex: 1001 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>我在哪</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '2px' }}>
            <button onClick={() => setViewMode('map')} style={{ padding: '6px', background: viewMode === 'map' ? 'white' : 'transparent', color: viewMode === 'map' ? theme.primary : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><MapIcon size={18} /></button>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? theme.primary : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Plus size={18} /></button>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings size={18} /></button>
        </div>
      </div>

      {/* Custom Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            style={{ 
              position: 'fixed', top: 'var(--safe-area-top)', left: '50%', transform: 'translateX(-50%)', 
              zIndex: 5000, background: toast.type === 'error' ? '#ef4444' : theme.primary, 
              color: 'white', padding: '12px 24px', borderRadius: '40px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none'
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {viewMode === 'map' ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer
              center={[25.0339, 121.5644]}
              zoom={13}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={false}
            >
              <ChangeView center={userPos ? [userPos.lat, userPos.lng] : null} />
              <TileLayer url={theme.mapTile} />
              
              {userPos && (
                <Marker position={[userPos.lat, userPos.lng]} icon={userMarkerIcon} />
              )}

              {whereAmILocations.map(loc => (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={savedMarkerIcon(theme.primary)}>
                  <Popup>
                    <div style={{ width: '220px' }}>
                      <div onClick={() => setPreviewLoc(loc)} style={{ cursor: 'zoom-in' }}>
                        <MapSnapshot 
                          lat={loc.lat} 
                          lng={loc.lng} 
                          theme={theme} 
                          zoom={17} 
                          style={{ width: '100%', height: '110px' }} 
                        />
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{loc.name}</h3>
                        <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '12px' }}>{formatDate(loc.timestamp)}</p>
                        <button
                          onClick={() => handleNavigate(loc.lat, loc.lng, loc.name)}
                          style={{ width: '100%', padding: '10px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                          <Navigation size={14} /> 導航回去
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Float Buttons */}
            <div style={{ position: 'absolute', bottom: '24px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 1000, alignItems: 'center' }}>
              <button
                onClick={locateMe}
                style={{ flexShrink: 0, background: theme.cardBg, border: theme.border || 'none', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: theme.primary, cursor: 'pointer' }}
              >
                <Navigation size={20} className={locating ? 'spin' : ''} />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                style={{ flex: 1, background: theme.cardBg, border: theme.border || 'none', padding: '10px 12px', borderRadius: theme.radius, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: theme.primary, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                <Search size={16} /> 去到位置
              </button>

              <button
                onClick={handleSaveLocation}
                disabled={!userPos || locating}
                style={{ flex: 0.8, background: theme.primary, border: 'none', padding: '10px 12px', borderRadius: theme.radius, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', color: 'white', cursor: 'pointer', opacity: !userPos ? 0.5 : 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                <Save size={16} /> 記錄位置
              </button>
            </div>

            {error && (
              <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1000, background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>已儲存位置 ({whereAmILocations.length}/10)</h2>
               <button 
                onClick={() => setViewMode('map')}
                style={{ background: theme.secondary, color: theme.text, border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}
               >
                 + 新增位置
               </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {whereAmILocations.map(loc => (
                <motion.div 
                  key={loc.id} 
                  layout
                  style={{ background: theme.cardBg, borderRadius: theme.radius, boxShadow: theme.shadow, border: theme.border, overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', height: '100px' }}>
                    <div onClick={() => setPreviewLoc(loc)} style={{ width: '120px', height: '100%', cursor: 'zoom-in' }}>
                      <MapSnapshot 
                        lat={loc.lat} 
                        lng={loc.lng} 
                        theme={theme} 
                        zoom={17} 
                        style={{ width: '100%', height: '100%' }} 
                      />
                    </div>
                    <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {editingId === loc.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={e => e.key === 'Enter' && saveEdit()}
                              style={{ width: '100%', border: `1px solid ${theme.primary}`, borderRadius: '4px', padding: '2px 4px', fontSize: '14px', outline: 'none' }}
                            />
                            <button onClick={saveEdit} style={{ background: theme.primary, border: 'none', color: 'white', borderRadius: '4px', padding: '4px' }}><Check size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontWeight: 'bold', fontSize: '15px' }}>{loc.name}</h3>
                            <button onClick={() => startEditing(loc)} style={{ opacity: 0.3, background: 'none', border: 'none', color: 'inherit' }}><Edit2 size={12} /></button>
                          </div>
                        )}
                        <div style={{ fontSize: '11px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={10} /> {formatDate(loc.timestamp)}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleNavigate(loc.lat, loc.lng, loc.name)}
                          style={{ flex: 1, background: theme.primary, color: 'white', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Navigation size={12} /> 導航
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(loc.id)}
                          style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {whereAmILocations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                  <MapPin size={48} style={{ margin: '0 auto 16px' }} />
                  <p>尚未儲存任何位置</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>在地圖頁面點擊 記錄位置 來記錄當前位置</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Naming Modal */}
      <AnimatePresence>
        {isNaming && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '340px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>設定位置名稱</h3>
              <input 
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="請輸入地點名稱..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.secondary}`, background: theme.bg, color: 'inherit', outline: 'none', marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setIsNaming(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${theme.secondary}`, background: 'transparent', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button 
                  onClick={confirmSaveLocation}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: theme.primary, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  確認儲存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: theme.cardBg, width: '85%', maxWidth: '320px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>確認刪除？</h3>
              <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>刪除後將無法還原此地點紀錄。</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${theme.secondary}`, background: 'transparent', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    deleteWhereAmILocation(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  確認刪除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewLoc && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setPreviewLoc(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              style={{ position: 'relative', width: '100%', maxWidth: '500px' }}
            >
              <div style={{ width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                <MapSnapshot 
                  lat={previewLoc.lat} 
                  lng={previewLoc.lng} 
                  theme={theme} 
                  zoom={18} 
                  style={{ width: '100%', height: '100%' }} 
                />
              </div>
              <div style={{ position: 'absolute', top: '-50px', left: 0, right: 0, color: 'white', textAlign: 'center' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '20px' }}>{previewLoc.name}</h3>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>地圖快照预览</p>
              </div>
              <button 
                onClick={() => setPreviewLoc(null)}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '380px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 'bold' }}>應用設定</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>主題風格</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {Object.entries(themes).map(([key, t]) => (
                    <button 
                      key={key} 
                      onClick={() => setWhereAmISettings({ ...whereAmISettings, theme: key })} 
                      style={{ padding: '12px', borderRadius: '12px', border: 'none', background: whereAmISettings?.theme === key ? theme.primary : theme.secondary, color: whereAmISettings?.theme === key ? 'white' : theme.text, fontWeight: 'bold' }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => setShowSettings(false)}
                style={{ width: '100%', padding: '14px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
              >
                確定
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
