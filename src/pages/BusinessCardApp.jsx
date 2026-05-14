import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Plus, Camera, X, Check, Trash2, 
  Settings, Image as ImageIcon, Phone, Mail, MapPin, 
  User, Briefcase, Building, ChevronRight, Maximize2,
  MoreVertical, Edit2, Loader2, CameraIcon
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Tesseract from 'tesseract.js';

const themes = {
  cartoon: {
    name: '可愛卡通',
    bg: '#fff1f2',
    cardBg: 'white',
    text: '#881337',
    primary: '#fb7185',
    secondary: '#fbcfe8',
    accent: '#ff9a9e',
    radius: '24px',
    shadow: '0 8px 0 rgba(251, 113, 133, 0.1)',
    border: '3px solid #fb7185'
  },
  serious: {
    name: '專業嚴肅',
    bg: '#1a1a1a',
    cardBg: '#262626',
    text: '#f1f5f9',
    primary: '#3b82f6',
    secondary: '#334155',
    accent: '#1e293b',
    radius: '4px',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #475569'
  },
  forest: {
    name: '清新森林',
    bg: '#f0fdf4',
    cardBg: 'white',
    text: '#166534',
    primary: '#22c55e',
    secondary: '#dcfce7',
    accent: '#86efac',
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
    accent: '#e5e7eb',
    radius: '0px',
    shadow: 'none',
    border: '1px solid #000'
  }
};

export default function BusinessCardApp() {
  const navigate = useNavigate();
  const { 
    businessCards, addBusinessCard, updateBusinessCard, deleteBusinessCard,
    businessCardSettings, setBusinessCardSettings 
  } = useStore();
  
  const theme = themes[businessCardSettings?.theme] || themes.forest;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showDetailId, setShowDetailId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    company: '', name: '', title: '', mobile: '', phone: '', email: '', address: ''
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Manual Add State
  const [manualData, setManualData] = useState({
    company: '', name: '', title: '', mobile: '', phone: '', email: '', address: ''
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  const filteredCards = businessCards.filter(card => {
    const s = searchQuery.toLowerCase();
    const d = card.parsedData;
    return d.company.toLowerCase().includes(s) || 
           d.name.toLowerCase().includes(s) || 
           d.title.toLowerCase().includes(s) ||
           d.email.toLowerCase().includes(s);
  });

  // Organize cards into slots
  const getCardAtSlot = (index) => {
    return businessCards.find(c => c.slotIndex === index);
  };

  const maxSlot = Math.max(9, ...businessCards.map(c => c.slotIndex || 0));
  const totalPages = Math.ceil((maxSlot + 2) / 10); // +2 to ensure at least one empty slot triggers next page logic

  const [cameraStream, setCameraStream] = useState(null);

  // Handle stream attachment when video element is ready
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  // Camera Functions
  const startCamera = (slotIdx) => async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setSelectedSlotIndex(slotIdx);
      setCameraStream(stream);
      streamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("無法開啟相機，請檢查權限設定。");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
    setCameraStream(null);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw frame
    ctx.drawImage(video, 0, 0);
    
    // Auto-crop logic (simple version: crop the center area with business card aspect ratio 1.75:1)
    const cropWidth = canvas.width * 0.85;
    const cropHeight = cropWidth / 1.75;
    const startX = (canvas.width - cropWidth) / 2;
    const startY = (canvas.height - cropHeight) / 2;
    
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(canvas, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    
    const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    processImage(dataUrl);
  };

  const processImage = async (dataUrl) => {
    setIsProcessing(true);
    setProcessingStep('初始化辨識引擎...');
    
    try {
      // Use chi_tra for Traditional Chinese
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'chi_tra+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProcessingStep(`正在辨識: ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setProcessingStep('載入引擎核心...');
          } else if (m.status === 'loading language traineddata') {
            setProcessingStep('載入中文語言包...');
          }
        }
      });
      
      setProcessingStep('正在解析資訊...');
      const parsed = parseBusinessCardText(text);
      
      addBusinessCard({
        image: dataUrl,
        parsedData: parsed,
        slotIndex: selectedSlotIndex
      });
      
      setIsProcessing(false);
    } catch (err) {
      console.error("OCR error:", err);
      setIsProcessing(false);
      alert("辨識失敗，可能是網路問題或語言包載入失敗，請嘗試手動新增。");
    }
  };

  const parseBusinessCardText = (text) => {
    // Clean up text for better parsing
    const cleanText = text.replace(/\s+/g, ' '); 
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    
    const data = {
      company: '', name: '', title: '', mobile: '', phone: '', email: '', address: ''
    };

    // Improved Email Regex: handle cases where OCR might put spaces around @ or dots
    // Also handle common misidentifications of @ like (a) or [at]
    const emailPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/, // With spaces
      /[a-zA-Z0-9._%+-]+\(a\)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,      // (a) instead of @
      /[a-zA-Z0-9._%+-]+at[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i        // "at" instead of @
    ];

    const mobileRegex = /(09\d{2}-?\d{3}-?\d{3})/;
    const phoneRegex = /(0\d{1,2}-?\d{7,8})/;

    // Try to find email in the entire text first
    for (const pattern of emailPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.email = match[0].replace(/\s+/g, ''); // Remove spaces if matched
        break;
      }
    }

    lines.forEach(line => {
      // If email wasn't found globally, try line-by-line with more aggressive cleaning
      if (!data.email) {
        const cleanedLine = line.replace(/\s+/g, '');
        for (const pattern of emailPatterns) {
          const match = cleanedLine.match(pattern);
          if (match) {
            data.email = match[0];
            break;
          }
        }
      }

      if (mobileRegex.test(line) && !data.mobile) {
        data.mobile = line.match(mobileRegex)[0];
      } else if (phoneRegex.test(line) && !data.phone) {
        data.phone = line.match(phoneRegex)[0];
      } else if ((line.includes('市') || line.includes('路') || line.includes('縣') || line.includes('區')) && !data.address) {
        data.address = line;
      }
    });

    // Heuristics for name/title/company
    // Often Company is first, then Name, then Title
    // But we avoid lines that we already identified as phone/email/address
    const infoLines = lines.filter(l => 
      !mobileRegex.test(l) && 
      !phoneRegex.test(l) && 
      !emailPatterns[0].test(l) && 
      !(l.includes('市') || l.includes('路') || l.includes('區'))
    );

    if (infoLines.length > 0) data.company = infoLines[0];
    if (infoLines.length > 1) {
      // If the second line is very short, it's likely the name
      if (infoLines[1].length < 10) {
        data.name = infoLines[1];
        if (infoLines.length > 2) data.title = infoLines[2];
      } else {
        // Otherwise maybe first line was name? Hard to tell, stick to a basic order
        data.name = infoLines[1];
        if (infoLines.length > 2) data.title = infoLines[2];
      }
    }

    return data;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    addBusinessCard({
      image: null,
      parsedData: manualData,
      slotIndex: selectedSlotIndex
    });
    setShowManualForm(false);
    setManualData({ company: '', name: '', title: '', mobile: '', phone: '', email: '', address: '' });
  };

  const selectedDetailCard = businessCards.find(c => c.id === showDetailId);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, height: '100dvh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', overflow: 'hidden' }}>
      
      {/* Header */}
      <div className="app-header" style={{ background: theme.primary, color: 'white', borderBottom: theme.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>名片槽</h1>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '16px', background: 'transparent' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', opacity: 0.5 }} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋姓名、公司、職稱..."
            style={{ 
              width: '100%', padding: '12px 12px 12px 40px', borderRadius: theme.radius, 
              border: theme.border || `1px solid ${theme.secondary}`, background: theme.cardBg, 
              color: 'inherit', outline: 'none', fontSize: '14px' 
            }}
          />
        </div>
      </div>

      {/* Grid of Business Cards (2x5 Slots with Pagination) */}
      <div style={{ flex: 1, padding: '0 0 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <motion.div 
          drag="x"
          dragConstraints={{ left: -((totalPages - 1) * window.innerWidth), right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x;
            if (swipe < -50 && currentPage < totalPages - 1) {
              setCurrentPage(currentPage + 1);
            } else if (swipe > 50 && currentPage > 0) {
              setCurrentPage(currentPage - 1);
            }
          }}
          animate={{ x: -(currentPage * window.innerWidth) }}
          style={{ 
            display: 'flex', width: `${totalPages * 100}%`, height: '100%',
            cursor: 'grab'
          }}
        >
          {Array.from({ length: totalPages }).map((_, pIdx) => (
            <div key={pIdx} style={{ width: '100vw', padding: '0 16px', height: '100%' }}>
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px',
                background: theme.accent, padding: '20px', borderRadius: '24px',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.15)', height: '100%',
                maxHeight: '650px',
                position: 'relative', border: '8px solid rgba(0,0,0,0.05)'
              }}>
                {Array.from({ length: 10 }).map((__, sIdx) => {
                  const globalIdx = pIdx * 10 + sIdx;
                  const card = getCardAtSlot(globalIdx);
                  const isFilteredOut = searchQuery && card && !filteredCards.find(fc => fc.id === card.id);

                  return (
                    <motion.div 
                      key={globalIdx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (card) {
                          setShowDetailId(card.id);
                        } else {
                          startCamera(globalIdx)();
                        }
                      }}
                      style={{ 
                        aspectRatio: '1.75/1', background: card ? 'white' : 'rgba(255,255,255,0.1)', 
                        borderRadius: '6px', opacity: isFilteredOut ? 0.3 : 1,
                        boxShadow: card ? '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.05)' : 'none',
                        overflow: 'hidden', cursor: 'pointer',
                        border: card ? '1px solid rgba(0,0,0,0.05)' : '2px dashed rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        transform: card ? `rotate(${globalIdx % 2 === 0 ? 1 : -1}deg)` : 'none'
                      }}
                    >
                      {card ? (
                        card.image ? (
                          <img src={card.image} alt="Business Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ padding: '10px', textAlign: 'center', color: '#1e293b' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', lineHeight: 1.2, marginBottom: '2px' }}>{card.parsedData.name}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.parsedData.company}</div>
                          </div>
                        )
                      ) : (
                        <div style={{ opacity: 0.3, color: 'white' }}>
                          <Plus size={24} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Page Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.primary, opacity: i === currentPage ? 1 : 0.3 }} />
          ))}
        </div>
      </div>

      {/* Camera UI */}
      <AnimatePresence>
        {showCamera && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'black', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              {/* Scan Overlay */}
              <div style={{ 
                position: 'absolute', width: '85%', aspectRatio: '1.75/1', 
                border: '2px solid white', borderRadius: '8px',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
              }}>
                <div style={{ position: 'absolute', top: '-40px', left: 0, right: 0, textAlign: 'center', color: 'white', fontSize: '15px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  請將名片對準框線
                </div>
                {/* Corner Accents */}
                <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '24px', height: '24px', borderTop: '4px solid #fb7185', borderLeft: '4px solid #fb7185' }} />
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '24px', height: '24px', borderTop: '4px solid #fb7185', borderRight: '4px solid #fb7185' }} />
                <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '24px', height: '24px', borderBottom: '4px solid #fb7185', borderLeft: '4px solid #fb7185' }} />
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderBottom: '4px solid #fb7185', borderRight: '4px solid #fb7185' }} />
              </div>
            </div>

            <div style={{ padding: '30px 20px 50px', background: 'rgba(0,0,0,0.9)', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center' }}>
              <button onClick={stopCamera} style={{ color: 'white', background: 'none', border: 'none', fontSize: '15px', fontWeight: 'bold' }}>取消</button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={takePhoto}
                  style={{ 
                    width: '76px', height: '76px', borderRadius: '50%', background: 'white', 
                    border: '6px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <div style={{ width: '58px', height: '58px', borderRadius: '50%', border: '2px solid black' }} />
                </button>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>拍照</span>
              </div>

              <button 
                onClick={() => { stopCamera(); setShowManualForm(true); }}
                style={{ 
                  color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', 
                  padding: '10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' 
                }}
              >
                <Edit2 size={20} />
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>手動新增</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Form Modal */}
      <AnimatePresence>
        {showManualForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: theme.cardBg, width: '90%', maxWidth: '400px', maxHeight: '85vh', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border, overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>手動輸入名片</h3>
                <button onClick={() => setShowManualForm(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
              </div>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InputGroup label="公司名稱" icon={<Building size={16} />} value={manualData.company} onChange={v => setManualData({...manualData, company: v})} />
                <InputGroup label="姓名" icon={<User size={16} />} value={manualData.name} onChange={v => setManualData({...manualData, name: v})} />
                <InputGroup label="職稱" icon={<Briefcase size={16} />} value={manualData.title} onChange={v => setManualData({...manualData, title: v})} />
                <InputGroup label="手機" icon={<Phone size={16} />} value={manualData.mobile} onChange={v => setManualData({...manualData, mobile: v})} />
                <InputGroup label="市內電話" icon={<Phone size={16} />} value={manualData.phone} onChange={v => setManualData({...manualData, phone: v})} />
                <InputGroup label="Email" icon={<Mail size={16} />} value={manualData.email} onChange={v => setManualData({...manualData, email: v})} />
                <InputGroup label="地址" icon={<MapPin size={16} />} value={manualData.address} onChange={v => setManualData({...manualData, address: v})} />
                
                <button 
                  type="submit"
                  style={{ 
                    marginTop: '12px', padding: '16px', borderRadius: '12px', background: theme.primary, 
                    color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px'
                  }}
                >
                  儲存名片
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Processing Loader */}
      <AnimatePresence>
        {isProcessing && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <motion.div 
              animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ marginBottom: '20px' }}
            ><Loader2 size={48} /></motion.div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{processingStep}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>請稍候，這可能需要幾秒鐘...</div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailId && selectedDetailCard && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}>
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              style={{ 
                background: theme.cardBg, width: '100%', height: '85vh', 
                borderRadius: `${theme.radius} ${theme.radius} 0 0`, padding: '24px', 
                color: theme.text, display: 'flex', flexDirection: 'column', gap: '20px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '20px' }}>{isEditing ? '編輯名片' : '名片詳情'}</h3>
                <button 
                  onClick={() => { setShowDetailId(null); setIsEditing(false); }} 
                  style={{ background: 'none', border: 'none', color: 'inherit' }}
                >
                  <X size={24} />
                </button>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <InputGroup label="公司名稱" icon={<Building size={16} />} value={editData.company} onChange={v => setEditData({...editData, company: v})} />
                  <InputGroup label="姓名" icon={<User size={16} />} value={editData.name} onChange={v => setEditData({...editData, name: v})} />
                  <InputGroup label="職稱" icon={<Briefcase size={16} />} value={editData.title} onChange={v => setEditData({...editData, title: v})} />
                  <InputGroup label="手機" icon={<Phone size={16} />} value={editData.mobile} onChange={v => setEditData({...editData, mobile: v})} />
                  <InputGroup label="市內電話" icon={<Phone size={16} />} value={editData.phone} onChange={v => setEditData({...editData, phone: v})} />
                  <InputGroup label="Email" icon={<Mail size={16} />} value={editData.email} onChange={v => setEditData({...editData, email: v})} />
                  <InputGroup label="地址" icon={<MapPin size={16} />} value={editData.address} onChange={v => setEditData({...editData, address: v})} />
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button 
                      onClick={() => setIsEditing(false)}
                      style={{ flex: 1, padding: '16px', borderRadius: '12px', background: theme.secondary, color: theme.text, border: 'none', fontWeight: 'bold' }}
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => {
                        updateBusinessCard(selectedDetailCard.id, { ...selectedDetailCard, parsedData: editData });
                        setIsEditing(false);
                      }}
                      style={{ flex: 1, padding: '16px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold' }}
                    >
                      儲存修改
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {selectedDetailCard.image && (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1.75/1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <img src={selectedDetailCard.image} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => setZoomImage(selectedDetailCard.image)}
                        style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%' }}
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: `1px solid ${theme.secondary}`, position: 'relative' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedDetailCard.parsedData.name}</div>
                      <div style={{ fontSize: '16px', opacity: 0.7 }}>{selectedDetailCard.parsedData.title}</div>
                      <div style={{ fontSize: '18px', fontWeight: '500', marginTop: '8px' }}>{selectedDetailCard.parsedData.company}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <DetailItem icon={<Phone size={18} />} label="手機" value={selectedDetailCard.parsedData.mobile} theme={theme} />
                      <DetailItem icon={<Phone size={18} />} label="市話" value={selectedDetailCard.parsedData.phone} theme={theme} />
                      <DetailItem icon={<Mail size={18} />} label="Email" value={selectedDetailCard.parsedData.email} theme={theme} />
                      <DetailItem icon={<MapPin size={18} />} label="地址" value={selectedDetailCard.parsedData.address} theme={theme} />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        setEditData(selectedDetailCard.parsedData);
                        setIsEditing(true);
                      }}
                      style={{ flex: 1, padding: '16px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Edit2 size={18} /> 編輯資訊
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('確定要刪除這張名片嗎？')) {
                          deleteBusinessCard(selectedDetailCard.id);
                          setShowDetailId(null);
                        }
                      }}
                      style={{ flex: 1, padding: '16px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Trash2 size={18} /> 刪除
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom Image Overlay */}
      <AnimatePresence>
        {zoomImage && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setZoomImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              src={zoomImage} alt="Zoomed" 
              style={{ width: '100%', transform: 'rotate(0deg)' }} 
            />
            <button style={{ position: 'absolute', top: '40px', right: '20px', color: 'white', background: 'none', border: 'none' }}><X size={32} /></button>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: theme.cardBg, width: '90%', maxWidth: '380px', padding: '24px', borderRadius: theme.radius, color: theme.text, border: theme.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 'bold' }}>名片槽設定</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X /></button>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>主題風格</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {Object.entries(themes).map(([key, t]) => (
                    <button 
                      key={key} 
                      onClick={() => setBusinessCardSettings({ ...businessCardSettings, theme: key })} 
                      style={{ padding: '12px', borderRadius: '12px', border: 'none', background: businessCardSettings?.theme === key ? theme.primary : theme.secondary, color: businessCardSettings?.theme === key ? 'white' : theme.text, fontWeight: 'bold' }}
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

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

function DetailItem({ icon, label, value, theme }) {
  if (!value) return null;
  
  const handleClick = () => {
    if (label === 'Email') {
      window.location.href = `mailto:${value}`;
    } else if (label === '手機' || label === '市話') {
      window.location.href = `tel:${value}`;
    } else if (label === '地址') {
      window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
    }
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
        background: 'rgba(0,0,0,0.03)', borderRadius: '12px', cursor: 'pointer'
      }}
    >
      <div style={{ color: theme.primary }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', opacity: 0.5 }}>{label}</div>
        <div style={{ fontWeight: '500' }}>{value}</div>
      </div>
      <ChevronRight size={16} style={{ opacity: 0.3 }} />
    </div>
  );
}

function InputGroup({ label, icon, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 'bold', opacity: 0.7, marginLeft: '4px' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: '12px', opacity: 0.4 }}>{icon}</div>
        <input 
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ 
            width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', 
            border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)', 
            color: 'inherit', outline: 'none', fontSize: '14px' 
          }}
        />
      </div>
    </div>
  );
}
