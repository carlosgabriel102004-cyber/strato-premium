
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

type TimeFilter = 'all' | 'today' | '7days' | '15days' | '30days' | 'custom';

// A dynamic color generator for different accounts
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
const getAccountColor = (name: string, index: number) => {
    return COLORS[index % COLORS.length];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const parseDate = (dStr: string) => {
    const [day, month, year] = dStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all') return transactions;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      const tDate = parseDate(t.date);
      tDate.setHours(0, 0, 0, 0);

      switch (timeFilter) {
        case 'today':
          return tDate.getTime() === now.getTime();
        case '7days': {
          const limit = new Date(now);
          limit.setDate(now.getDate() - 7);
          return tDate >= limit;
        }
        case '15days': {
          const limit = new Date(now);
          limit.setDate(now.getDate() - 15);
          return tDate >= limit;
        }
        case '30days': {
          const limit = new Date(now);
          limit.setDate(now.getDate() - 30);
          return tDate >= limit;
        }
        case 'custom': {
          if (!customRange.start || !customRange.end) return true;
          const start = new Date(customRange.start);
          const end = new Date(customRange.end);
          return tDate >= start && tDate <= end;
        }
        default:
          return true;
      }
    });
  }, [transactions, timeFilter, customRange]);

  const chartData = useMemo(() => {
    // 1. Gastos por Conta
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const expensesTotal = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenseSourceMap: Record<string, number> = {};
    expenses.forEach(t => {
      const label = t.account || t.source || 'Outros';
      expenseSourceMap[label] = (expenseSourceMap[label] || 0) + Math.abs(t.amount);
    });
    const expenseSourceData = Object.entries(expenseSourceMap)
      .map(([name, value], index) => ({ 
        name, value, 
        color: getAccountColor(name, index)
      }))
      .sort((a, b) => b.value - a.value);

    // 2. Saldo por Conta
    const balanceSourceMap: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const label = t.account || t.source || 'Outros';
      balanceSourceMap[label] = (balanceSourceMap[label] || 0) + t.amount;
    });
    const balanceSourceData = Object.entries(balanceSourceMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({ 
        name, value, 
        color: getAccountColor(name, index)
      }))
      .sort((a, b) => b.value - a.value);
    const balanceTotal = balanceSourceData.reduce((sum, item) => sum + item.value, 0);

    // 3. Evolução Mensal (Ganhos, Gastos, Saldo)
    const monthlyMap: Record<string, { income: number; expense: number; month: string; sortKey: string }> = {};
    filteredTransactions.forEach(t => {
      const [d, m, y] = t.date.split('/');
      const monthKey = `${m}/${y}`;
      const sortKey = `${y}-${m}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0, month: monthKey, sortKey };
      }
      if (t.type === 'income') monthlyMap[monthKey].income += t.amount;
      else monthlyMap[monthKey].expense += Math.abs(t.amount);
    });

    const evolutionData = Object.values(monthlyMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(item => ({
        ...item,
        balance: item.income - item.expense
      }));

    return { expenseSourceData, balanceSourceData, expensesTotal, balanceTotal, evolutionData };
  }, [filteredTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl p-3 text-xs font-medium">
          {label && <p className="text-gray-400 mb-2 uppercase tracking-wider text-[10px]">{label}</p>}
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="text-gray-300">{p.name}:</span>
              </div>
              <span className="text-white">{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const FilterButton = ({ id, label }: { id: TimeFilter; label: string }) => (
    <button
      onClick={() => setTimeFilter(id)}
      className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all ${
        timeFilter === id 
        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
        : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Período */}
      <div className="flex items-center justify-center">
        <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <i className="far fa-calendar-alt text-gray-400 text-sm"></i>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Período</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <FilterButton id="all" label="Tudo" />
            <FilterButton id="today" label="Hoje" />
            <FilterButton id="7days" label="7 Dias" />
            <FilterButton id="15days" label="15 Dias" />
            <FilterButton id="30days" label="30 Dias" />
            <FilterButton id="custom" label="Custom" />
          </div>
        </div>
      </div>

      {timeFilter === 'custom' && (
        <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <input 
            type="date" 
            className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-full text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            value={customRange.start}
            onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
          />
          <span className="text-gray-500 text-xs font-semibold">até</span>
          <input 
            type="date" 
            className="px-3 py-1.5 bg-black/50 border border-white/10 rounded-full text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-white/30"
            value={customRange.end}
            onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
          />
        </div>
      )}

      {/* Grid de Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Conta */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-arrow-down text-rose-400"></i>
              Gastos por Conta
            </h3>
            <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full uppercase">Saídas</span>
          </div>
          <div className="h-[250px] relative">
            {chartData.expenseSourceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.expenseSourceData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {chartData.expenseSourceData.map((entry, index) => (
                        <Cell key={`cell-exp-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip wrapperStyle={{ zIndex: 1000 }} content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Saídas</span>
                  <span className="text-lg font-light text-white">{formatCurrency(chartData.expensesTotal)}</span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center px-4">
                <i className="fas fa-chart-pie mb-3 text-3xl opacity-20 text-white"></i>
                <span className="text-xs italic">Sem saídas no período</span>
              </div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
            {chartData.expenseSourceData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <span className="truncate font-medium">{entry.name}</span>
                </div>
                <span className="font-semibold text-white ml-2">{chartData.expensesTotal > 0 ? Math.round((entry.value / chartData.expensesTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saldo por Conta */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-wallet text-blue-400"></i>
              Saldo por Conta
            </h3>
            <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full uppercase">Líquido</span>
          </div>
          <div className="h-[250px] relative">
            {chartData.balanceSourceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.balanceSourceData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {chartData.balanceSourceData.map((entry, index) => (
                        <Cell key={`cell-bal-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip wrapperStyle={{ zIndex: 1000 }} content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Positivo</span>
                  <span className="text-lg font-light text-white">{formatCurrency(chartData.balanceTotal)}</span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center px-4">
                <i className="fas fa-wallet mb-3 text-3xl opacity-20 text-white"></i>
                <span className="text-xs italic">Sem saldo positivo no período</span>
              </div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
            {chartData.balanceSourceData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-gray-300 bg-white/5 p-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <span className="truncate font-medium">{entry.name}</span>
                </div>
                <span className="font-semibold text-white ml-2">{chartData.balanceTotal > 0 ? Math.round((entry.value / chartData.balanceTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução de Vendas/Finanças (Smooth Line/Area) */}
      <div className="glass-card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <i className="fas fa-chart-line text-blue-400"></i>
            Evolução Mensal
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Ganhos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400"></div>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Gastos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Saldo</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          {chartData.evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip wrapperStyle={{ zIndex: 100 }} content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Ganhos"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#1e1e1e' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Gastos"
                  stroke="#fb7185" 
                  strokeWidth={2}
                  fill="transparent"
                  dot={{ r: 4, fill: '#fb7185', strokeWidth: 2, stroke: '#1e1e1e' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  name="Saldo"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#1e1e1e' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center px-6">
              <i className="fas fa-chart-area text-4xl mb-4 opacity-20 text-white"></i>
              <p className="text-sm font-medium italic">Selecione mais períodos para visualizar a evolução financeira.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

