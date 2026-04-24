import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, PieChart, CreditCard, Activity } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis } from 'recharts';

export default function CreditAnalysis() {
  const navigate = useNavigate();
  const { cards, cardBills } = useStore();
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const cardColors = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

  const yearlyBills = cardBills.filter(b => b.year === parseInt(year));
  const totalAmount = yearlyBills.reduce((sum, b) => sum + b.amount, 0);

  // Pie chart data: sum per card
  const pieData = cards.map((card, idx) => {
    const cardSum = yearlyBills.filter(b => b.cardId === card.id).reduce((sum, b) => sum + b.amount, 0);
    return {
      name: card.name,
      value: cardSum,
      color: cardColors[idx % cardColors.length]
    };
  }).filter(d => d.value > 0);

  // Line chart data: Total sum per month
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const monthId = i + 1;
    const monthTotal = yearlyBills.filter(b => b.month === monthId).reduce((sum, b) => sum + b.amount, 0);
    return {
      month: `${monthId}月`,
      amount: monthTotal
    };
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="app-header" style={{ alignItems: 'center', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px' }}>
        <h1 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PieChart size={20} color="#f59e0b" /> 總消費分析
        </h1>
        <select 
          className="glass-input" 
          value={year} 
          onChange={e => setYear(e.target.value)}
          style={{ width: 'auto', padding: '6px 12px', fontSize: '14px', borderRadius: '20px' }}
        >
          {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y} 年</option>)}
        </select>
      </div>

      <div className="page-content">
        
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {year} 年度總消費
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b' }}>
            ${totalAmount.toLocaleString()}
          </div>
        </div>

        {totalAmount > 0 ? (
          <>
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#f8fafc', fontWeight: '600' }}>
                各卡片消費佔比
              </h2>
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => `$${val.toLocaleString()}`}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: d.color }}></div>
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }} className="truncate">{d.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{Math.round(d.value/totalAmount*100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px 16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#f8fafc', fontWeight: '600' }}>
                年度消費趨勢
              </h2>
              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f59e0b' }}
                      formatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Line type="basis" dataKey="amount" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>
            <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>本年度尚無任何消費紀錄</p>
          </div>
        )}

      </div>

      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate('/credit')}>
          <ArrowLeft />
          <span>返回</span>
        </div>
      </div>
    </div>
  );
}
