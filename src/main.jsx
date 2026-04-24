import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 偵測 Android 平台並加入樣式標籤以處理安全區域
if (/android/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('android-platform');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
