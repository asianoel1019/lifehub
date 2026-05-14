import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import EnglishApp from './pages/EnglishApp';
import EnglishQuiz from './pages/EnglishQuiz';
import FuelApp from './pages/FuelApp';
import CreditApp from './pages/CreditApp';
import CreditAnalysis from './pages/CreditAnalysis';
import SportApp from './pages/SportApp';
import UbikeApp from './pages/UbikeApp';
import TraApp from './pages/TraApp';
import ShiftApp from './pages/ShiftApp';
import TodoApp from './pages/TodoApp';
import LuckyDrawApp from './pages/LuckyDrawApp';
import DiaryApp from './pages/DiaryApp';
import WeightApp from './pages/WeightApp';
import StockApp from './pages/StockApp';
import AnswerBookApp from './pages/AnswerBookApp';
import ExchangeApp from './pages/ExchangeApp';
import ParkingApp from './pages/ParkingApp';
import MovieApp from './pages/MovieApp';
import WhereAmIApp from './pages/WhereAmIApp';
import BusinessCardApp from './pages/BusinessCardApp';
import AppLockScreen from './components/AppLockScreen';

function RequireWelcome({ children }) {
  const hasSeenWelcome = useStore(state => state.hasSeenWelcome);
  if (!hasSeenWelcome) return <Navigate to="/welcome" replace />;
  return children;
}

function RequireAppLock({ children }) {
  const isEnabled = useStore(state => !!state.appLockPin);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  // If the app lock is enabled and not unlocked in this session, show the lock screen
  if (isEnabled && !isUnlocked) {
    return <AppLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return children;
}

function App() {
  React.useEffect(() => {
    // 每次重新進入 App 時，強制重置歡迎畫面狀態
    useStore.setState({ hasSeenWelcome: false });
  }, []);

  return (
    <div className="app-container">
      <BrowserRouter>
        <RequireAppLock>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/" element={<RequireWelcome><Home /></RequireWelcome>} />
            
            <Route path="/english" element={<RequireWelcome><EnglishApp /></RequireWelcome>} />
            <Route path="/english/quiz" element={<RequireWelcome><EnglishQuiz /></RequireWelcome>} />
            
            <Route path="/fuel" element={<RequireWelcome><FuelApp /></RequireWelcome>} />
            
            <Route path="/credit" element={<RequireWelcome><CreditApp /></RequireWelcome>} />
            <Route path="/credit/analysis" element={<RequireWelcome><CreditAnalysis /></RequireWelcome>} />
            
            <Route path="/sport" element={<RequireWelcome><SportApp /></RequireWelcome>} />
            
            <Route path="/ubike" element={<RequireWelcome><UbikeApp /></RequireWelcome>} />
            
            <Route path="/tra" element={<RequireWelcome><TraApp /></RequireWelcome>} />

            <Route path="/shift" element={<RequireWelcome><ShiftApp /></RequireWelcome>} />

            <Route path="/todo" element={<RequireWelcome><TodoApp /></RequireWelcome>} />
            <Route path="/luckydraw" element={<RequireWelcome><LuckyDrawApp /></RequireWelcome>} />
            <Route path="/diary" element={<RequireWelcome><DiaryApp /></RequireWelcome>} />
            <Route path="/weight" element={<RequireWelcome><WeightApp /></RequireWelcome>} />
            <Route path="/stock" element={<RequireWelcome><StockApp /></RequireWelcome>} />
            <Route path="/answerbook" element={<RequireWelcome><AnswerBookApp /></RequireWelcome>} />
            <Route path="/exchange" element={<RequireWelcome><ExchangeApp /></RequireWelcome>} />
            <Route path="/parking" element={<RequireWelcome><ParkingApp /></RequireWelcome>} />
            <Route path="/movie" element={<RequireWelcome><MovieApp /></RequireWelcome>} />
            <Route path="/whereami" element={<RequireWelcome><WhereAmIApp /></RequireWelcome>} />
            <Route path="/businesscard" element={<RequireWelcome><BusinessCardApp /></RequireWelcome>} />
          </Routes>
        </RequireAppLock>
      </BrowserRouter>
    </div>
  );
}

export default App;
