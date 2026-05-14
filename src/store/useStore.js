import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // === Global App State ===
      hasSeenWelcome: false,
      setHasSeenWelcome: () => set({ hasSeenWelcome: true }),
      appLockPin: null, // string (e.g. "1234") or null
      setAppLockPin: (pin) => set({ appLockPin: pin }),

      hiddenApps: [], // ['english', 'fuel', ...]
      toggleAppVisibility: (appId) => set((state) => ({
        hiddenApps: state.hiddenApps.includes(appId)
          ? state.hiddenApps.filter(id => id !== appId)
          : [...state.hiddenApps, appId]
      })),

      appOrder: [], // e.g. ['english', 'fuel', ...] to store correct sort
      setAppOrder: (newOrder) => set({ appOrder: newOrder }),
      
      // === Sub-App 1: English Learning ===
      dailyVocab: [],       // Current 10 words
      lastStudyDate: null,  // Track if we need to fetch new words
      studyLevel: 'basic',  // 'basic' (1000) or 'intermediate' (7000)
      
      setDailyVocab: (words, date) => set({ dailyVocab: words, lastStudyDate: date }),
      setStudyLevel: (level) => set({ studyLevel: level }),
      
      // === Sub-App 2: Fuel Tracker ===
      vehicles: [],
      fuelLogs: [], // { id, vehicleId, date, amount, price, mileage }
      
      addVehicle: (vehicle) => set((state) => ({ 
        vehicles: [...state.vehicles, { id: Date.now().toString(), ...vehicle }] 
      })),
      addFuelLog: (log) => set((state) => ({ 
        fuelLogs: [...state.fuelLogs, { id: Date.now().toString(), ...log }] 
      })),
      updateFuelLog: (id, updatedLog) => set((state) => ({
        fuelLogs: state.fuelLogs.map(log => log.id === id ? { ...log, ...updatedLog } : log)
      })),
      deleteFuelLog: (id) => set((state) => ({
        fuelLogs: state.fuelLogs.filter(log => log.id !== id)
      })),
      
      // === Sub-App 3: Credit Card ===
      cards: [], // { id, name, limit }
      cardBills: [], // { id, cardId, year, month, amount }
      
      addCard: (card) => set((state) => ({
        cards: [...state.cards, { id: Date.now().toString(), ...card }]
      })),
      addCardBill: (bill) => set((state) => ({
        cardBills: [...state.cardBills, { id: Date.now().toString(), ...bill }]
      })),
      updateCardBill: (id, updatedBill) => set((state) => ({
        cardBills: state.cardBills.map(b => b.id === id ? { ...b, ...updatedBill } : b)
      })),
      deleteCardBill: (id) => set((state) => ({
        cardBills: state.cardBills.filter(b => b.id !== id)
      })),
      
      // === Sub-App 4: My Sport (Strava) ===
      stravaCredentials: {
        clientId: '',
        clientSecret: '',
        refreshToken: '',
      },
      stravaActivities: [],
      stravaLastFetch: null,
      
      setStravaCredentials: (credentials) => set({ stravaCredentials: credentials }),
      setStravaActivities: (activities) => set({ 
        stravaActivities: activities, 
        stravaLastFetch: new Date().toISOString() 
      }),

      // TDX API Integration (for Taiwan Railway)
      tdxCredentials: {
        clientId: '',
        clientSecret: '',
        accessToken: ''
      },
      setTdxCredentials: (credentials) => set({ tdxCredentials: credentials }),
      
      traStations: [], // Cache for TRA stations
      setTraStations: (stations) => set({ traStations: stations }),

      // === Sub-App 7: Shift Management ===
      shiftStaff: [], // { id, name, color }
      shiftTypes: [], // { id, name, timeRange, color }
      shiftSchedules: {}, // { 'YYYY-MM-DD': [ { shiftId, staffIds: [] } ] }

      addShiftStaff: (staff) => set((state) => ({ shiftStaff: [...state.shiftStaff, { id: Date.now().toString(), color: '#3b82f6', ...staff }] })),
      updateShiftStaff: (id, updated) => set((state) => ({ shiftStaff: state.shiftStaff.map(s => s.id === id ? { ...s, ...updated } : s) })),
      deleteShiftStaff: (id) => set((state) => ({ shiftStaff: state.shiftStaff.filter(s => s.id !== id) })),

      addShiftType: (type) => set((state) => ({ shiftTypes: [...state.shiftTypes, { id: Date.now().toString(), color: '#8b5cf6', ...type }] })),
      updateShiftType: (id, updated) => set((state) => ({ shiftTypes: state.shiftTypes.map(t => t.id === id ? { ...t, ...updated } : t) })),
      deleteShiftType: (id) => set((state) => ({ shiftTypes: state.shiftTypes.filter(t => t.id !== id) })),

      setShiftSchedule: (dateStr, assignedShifts) => set((state) => ({
        shiftSchedules: { ...state.shiftSchedules, [dateStr]: assignedShifts }
      })),

      // Batch override for applying to a week or month
      batchSetShiftSchedules: (updates) => set((state) => ({
        shiftSchedules: { ...state.shiftSchedules, ...updates }
      })),

      // === Sub-App 8: ToDo List ===
      todoCategories: [{ id: 'default', name: '我的清單', icon: '📝' }],
      todoItems: [], // { id, categoryId, text, completed, createdAt }
      
      addTodoCategory: (name) => set((state) => ({ 
        todoCategories: [...state.todoCategories, { id: Date.now().toString(), name, icon: '🏷️' }] 
      })),
      deleteTodoCategory: (id) => set((state) => ({
        todoCategories: state.todoCategories.filter(c => c.id !== id),
        todoItems: state.todoItems.filter(i => i.categoryId !== id)
      })),
      addTodoItem: (categoryId, text) => set((state) => ({
        todoItems: [...state.todoItems, { id: Date.now().toString(), categoryId, text, completed: false, createdAt: new Date().toISOString() }]
      })),
      toggleTodoItem: (id) => set((state) => ({
        todoItems: state.todoItems.map(i => i.id === id ? { ...i, completed: !i.completed } : i)
      })),
      editTodoItem: (id, newText) => set((state) => ({
        todoItems: state.todoItems.map(i => i.id === id ? { ...i, text: newText } : i)
      })),
      deleteTodoItem: (id) => set((state) => ({
        todoItems: state.todoItems.filter(i => i.id !== id)
      })),

      // === Sub-App 9: Lucky Draw (抽籤轉盤) ===
      luckyDrawWheels: [
        { id: 'default', name: '預設轉盤', items: ['選項 1', '選項 2', '選項 3'] }
      ],
      addLuckyDrawWheel: (name) => set((state) => ({
        luckyDrawWheels: [...state.luckyDrawWheels, { id: Date.now().toString(), name, items: ['選項 A', '選項 B'] }]
      })),
      updateLuckyDrawWheel: (id, updated) => set((state) => ({
        luckyDrawWheels: state.luckyDrawWheels.map(w => w.id === id ? { ...w, ...updated } : w)
      })),
      deleteLuckyDrawWheel: (id) => set((state) => ({
        luckyDrawWheels: state.luckyDrawWheels.filter(w => w.id !== id)
      })),

      // === Sub-App 9.5: Lunch Flip Game ===
      lunchCategories: [
        { id: '1', name: '便當/台式', items: ['排骨飯', '雞腿飯', '控肉飯', '燒臘飯', '池上木片便當', '自助餐'], active: true },
        { id: '2', name: '麵食', items: ['牛肉麵', '炸醬麵', '陽春麵', '涼麵', '鍋燒意麵', '麵線'], active: true },
        { id: '3', name: '速食/美式', items: ['漢堡', '炸雞', '披薩', '熱狗堡', '潛艇堡(Subway)'], active: true },
        { id: '4', name: '日式', items: ['壽司', '拉麵', '丼飯', '咖哩飯', '定食', '烏龍麵'], active: true },
        { id: '5', name: '韓式', items: ['石鍋拌飯', '韓式炸雞', '豆腐鍋', '部隊鍋', '海鮮煎餅'], active: true },
        { id: '6', name: '南洋/泰式', items: ['打拋豬飯', '河粉', '海南雞飯', '叻沙麵', '越式法國麵包', '炒泡麵'], active: true },
        { id: '7', name: '健康/輕食', items: ['水煮餐盒', '沙拉', '三明治', '御飯糰', '地中海飲食', '優格', '果昔', '飯糰', '健康餐盒', '粥品'], active: true }
      ],
      setLunchCategories: (categories) => set({ lunchCategories: categories }),
      updateLunchCategory: (id, name, items) => set((state) => ({
        lunchCategories: state.lunchCategories.map(c => c.id === id ? { ...c, name, items } : c)
      })),

      // === Sub-App 10: Diary ===
      diaryEntries: [], // { id, date, content, mood, weather, category, tags: [], isDraft, lastModified }
      diaryCategories: ['工作', '私人', '健康', '旅遊', '心情回顧'],
      diarySettings: {
        fontFace: 'Noto Sans TC',
        isHandwriting: false,
        diaryDarkMode: false,
        theme: 'forest' // 'cartoon' | 'serious' | 'forest' | 'minimalist'
      },
      fuelSettings: { theme: 'forest' },
      englishSettings: { theme: 'forest' },
      creditSettings: { theme: 'forest' },
      ubikeSettings: { theme: 'forest' },
      sportSettings: { theme: 'forest' },
      traSettings: { theme: 'forest', defaultOrigin: '', defaultDestination: '' },
      luckyDrawSettings: { theme: 'forest' },
      shiftSettings: { theme: 'forest' },
      movieSettings: { theme: 'forest' },
      movieCredentials: { apiKey: '' },
      diaryDraft: null,

      addDiaryEntry: (entry) => set((state) => ({
        diaryEntries: [
          { id: Date.now().toString(), lastModified: new Date().toISOString(), ...entry },
          ...state.diaryEntries
        ]
      })),
      updateDiaryEntry: (id, updated) => set((state) => ({
        diaryEntries: state.diaryEntries.map(e => e.id === id ? { ...e, ...updated, lastModified: new Date().toISOString() } : e)
      })),
      deleteDiaryEntry: (id) => set((state) => ({
        diaryEntries: state.diaryEntries.filter(e => e.id !== id)
      })),
      saveDiaryDraft: (draft) => set({ diaryDraft: draft }),
      setDiarySettings: (settings) => set((state) => ({
        diarySettings: { ...state.diarySettings, ...settings }
      })),
      setFuelSettings: (settings) => set((state) => ({
        fuelSettings: { ...state.fuelSettings, ...settings }
      })),
      setEnglishSettings: (settings) => set((state) => ({
        englishSettings: { ...state.englishSettings, ...settings }
      })),
      setCreditSettings: (settings) => set((state) => ({
        creditSettings: { ...state.creditSettings, ...settings }
      })),
      setUbikeSettings: (settings) => set((state) => ({
        ubikeSettings: { ...state.ubikeSettings, ...settings }
      })),
      setSportSettings: (settings) => set((state) => ({
        sportSettings: { ...state.sportSettings, ...settings }
      })),
      setTraSettings: (settings) => set((state) => ({
        traSettings: { ...state.traSettings, ...settings }
      })),
      setLuckyDrawSettings: (settings) => set((state) => ({
        luckyDrawSettings: { ...state.luckyDrawSettings, ...settings }
      })),
      setShiftSettings: (settings) => set((state) => ({
        shiftSettings: { ...state.shiftSettings, ...settings }
      })),
      setMovieSettings: (settings) => set((state) => ({
        movieSettings: { ...state.movieSettings, ...settings }
      })),
      setMovieCredentials: (credentials) => set((state) => ({
        movieCredentials: { ...state.movieCredentials, ...credentials }
      })),

      // === Sub-App 11: Weight Tracker ===
      weightEntries: [], // { id, date, weight }
      weightGoal: {
        targetWeight: 0,
        weeklyLossGoal: 0.5,
        height: 0
      },
      weightSettings: {
        theme: 'forest' // 'cartoon' | 'serious' | 'forest' | 'minimalist'
      },

      addWeightEntry: (entry) => set((state) => {
        // Find if entry for this date exists, if so update, else add
        const existing = state.weightEntries.find(e => e.date === entry.date);
        if (existing) {
          return {
            weightEntries: state.weightEntries.map(e => e.date === entry.date ? { ...e, weight: entry.weight } : e)
          };
        }
        return {
          weightEntries: [...state.weightEntries, { id: Date.now().toString(), ...entry }].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
      }),
      deleteWeightEntry: (id) => set((state) => ({
        weightEntries: state.weightEntries.filter(e => e.id !== id)
      })),
      setWeightGoal: (goal) => set((state) => ({
        weightGoal: { ...state.weightGoal, ...goal }
      })),
      setWeightSettings: (settings) => set((state) => ({
        weightSettings: { ...state.weightSettings, ...settings }
      })),

      // === Sub-App 12: Stock Tracker ===
      stockWatchlist: [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: '0%', lastUpdated: null },
        { symbol: '2330.TW', name: '台積電', price: 0, change: 0, changePercent: '0%', lastUpdated: null }
      ],
      marketIndices: [
        { id: 'TAIEX', name: '加權指數', price: 0, change: 0, changePercent: '0%' },
        { id: 'NASDAQ', name: 'NASDAQ', price: 0, change: 0, changePercent: '0%' },
        { id: 'SP500', name: 'S&P 500', price: 0, change: 0, changePercent: '0%' }
      ],
      stockSettings: {
        apiKey: 'A5VH1HX7HF8NSBE5',
        refreshInterval: 60000,
        useTaiwanColors: true, // Red Up, Green Down
        theme: 'serious' // 'cartoon' | 'serious' | 'forest' | 'minimalist'
      },
      answerBookSettings: { theme: 'cartoon' }, // Default to cartoon for 'cute' aesthetic

      setStockSettings: (settings) => set((state) => ({
        stockSettings: { ...state.stockSettings, ...settings }
      })),
      setAnswerBookSettings: (settings) => set((state) => ({
        answerBookSettings: { ...state.answerBookSettings, ...settings }
      })),

      addToWatchlist: (stock) => set((state) => ({
        stockWatchlist: [...state.stockWatchlist, { ...stock, price: 0, change: 0, changePercent: '0%', lastUpdated: null }]
      })),
      removeFromWatchlist: (symbol) => set((state) => ({
        stockWatchlist: state.stockWatchlist.filter(s => s.symbol !== symbol)
      })),
      updateStockData: (symbol, data) => set((state) => ({
        stockWatchlist: state.stockWatchlist.map(s => s.symbol === symbol ? { ...s, ...data, lastUpdated: new Date().toISOString() } : s)
      })),
      updateIndexData: (id, data) => set((state) => ({
        marketIndices: state.marketIndices.map(idx => idx.id === id ? { ...idx, ...data } : idx)
      })),

      // Exchange App
      exchangeSettings: { theme: 'minimalist' },
      exchangeFavorites: [
        { base: 'USD', target: 'TWD' },
        { base: 'JPY', target: 'TWD' },
        { base: 'EUR', target: 'USD' }
      ],
      setExchangeSettings: (settings) => set((state) => ({
        exchangeSettings: { ...state.exchangeSettings, ...settings }
      })),
      addExchangeFavorite: (base, target) => set((state) => {
        // Prevent duplicates
        if (state.exchangeFavorites.some(f => f.base === base && f.target === target)) return state;
        return { exchangeFavorites: [...state.exchangeFavorites, { base, target }] };
      }),
      removeExchangeFavorite: (base, target) => set((state) => ({
        exchangeFavorites: state.exchangeFavorites.filter(f => !(f.base === base && f.target === target))
      })),

      // Parking App
      parkingSettings: { theme: 'forest' },
      setParkingSettings: (settings) => set((state) => ({
        parkingSettings: { ...state.parkingSettings, ...settings }
      })),

      // Where Am I App
      whereAmISettings: { 
        theme: 'forest'
      },
      whereAmILocations: [], // { id, name, lat, lng, streetViewUrl, timestamp }
      setWhereAmISettings: (settings) => set((state) => ({
        whereAmISettings: { ...state.whereAmISettings, ...settings }
      })),
      saveWhereAmILocation: (location) => set((state) => {
        const newLocations = [
          { id: Date.now().toString(), ...location },
          ...state.whereAmILocations
        ].slice(0, 10); // Keep max 10
        return { whereAmILocations: newLocations };
      }),
      deleteWhereAmILocation: (id) => set((state) => ({
        whereAmILocations: state.whereAmILocations.filter(l => l.id !== id)
      })),
      renameWhereAmILocation: (id, name) => set((state) => ({
        whereAmILocations: state.whereAmILocations.map(l => l.id === id ? { ...l, name } : l)
      })),

      // === Sub-App: Business Card (名片) ===
      businessCards: [], // { id, image, parsedData: { company, name, title, mobile, phone, email, address }, timestamp, slotIndex }
      businessCardSettings: { theme: 'forest' },
      
      addBusinessCard: (card) => set((state) => ({
        businessCards: [
          { id: Date.now().toString(), timestamp: new Date().toISOString(), ...card },
          ...state.businessCards
        ]
      })),
      updateBusinessCard: (id, updated) => set((state) => ({
        businessCards: state.businessCards.map(c => c.id === id ? { ...c, ...updated } : c)
      })),
      deleteBusinessCard: (id) => set((state) => ({
        businessCards: state.businessCards.filter(c => c.id !== id)
      })),
      setBusinessCardSettings: (settings) => set((state) => ({
        businessCardSettings: { ...state.businessCardSettings, ...settings }
      })),
    }),
    {
      name: 'android-pwa-storage',
      partialize: (state) => {
        const { hasSeenWelcome, ...rest } = state;
        return rest;
      },
    }
  )
);
