import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface MonthData {
  month: string;
  total: number;
  [bank: string]: any;
}

const parseCurrency = (val: string) => {
  if (!val) return 0;
  let clean = val.replace(/[R$\s"]/g, '').trim();
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const parseCSVLine = (line: string, separator: string = ','): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const BalancesDashboard: React.FC = () => {
  const [data, setData] = useState<MonthData[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenBanks, setHiddenBanks] = useState<Set<string>>(new Set());

  const toggleBank = (bank: string) => {
    setHiddenBanks(prev => {
      const next = new Set(prev);
      if (next.has(bank)) {
        next.delete(bank);
      } else {
        next.add(bank);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/1Y2hEw_g4tPKK9dWP5LDgTqKzsExSAZcoQ5ZvZunP9x4/export?format=csv');
        const text = await response.text();
        const lines = text.split(/\r?\n/);
        
        if (lines.length > 2) {
          const headers = parseCSVLine(lines[0]);
          const availableMonths = [];
          for (let i = 1; i < headers.length; i++) {
            if (headers[i] && headers[i] !== 'Dezembro (Meta)') {
               availableMonths.push({ index: i, name: headers[i] });
            }
          }
          
          const monthDataMap: Record<string, MonthData> = {};
          availableMonths.forEach(m => {
            monthDataMap[m.name] = { month: m.name.charAt(0).toUpperCase() + m.name.slice(1), total: 0 };
          });
          
          const foundBanks: string[] = [];
          
          // Row 4 to 14 (index 3 to 13) are banks
          for (let r = 3; r <= 13; r++) {
            if (r >= lines.length) break;
            const rowParts = parseCSVLine(lines[r]);
            const bankName = rowParts[0];
            if (!bankName) continue;
            
            foundBanks.push(bankName);
            availableMonths.forEach(m => {
              if (rowParts[m.index]) {
                const val = parseCurrency(rowParts[m.index]);
                if (val > 0) {
                  monthDataMap[m.name][bankName] = val;
                }
              }
            });
          }
          
          // Row 16 (index 15) is Total
          if (lines.length > 15) {
             const totalParts = parseCSVLine(lines[15]);
             availableMonths.forEach(m => {
               if (totalParts[m.index]) {
                 const tVal = parseCurrency(totalParts[m.index]);
                 if (tVal > 0) {
                    monthDataMap[m.name].total = tVal;
                 }
               }
             });
          }
          
          const finalData = availableMonths.filter(m => monthDataMap[m.name].total > 0).map(m => monthDataMap[m.name]);
          setBanks(foundBanks);
          setData(finalData);
        }
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        <i className="fas fa-spinner fa-spin mr-3"></i> Carregando saldos...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <div className="w-20 h-20 bg-[#1c1c1e] rounded-2xl flex items-center justify-center text-gray-500 text-3xl border border-white/5">
          <i className="fas fa-wallet"></i>
        </div>
        <h2 className="text-xl font-semibold text-white">Nenhum dado encontrado</h2>
        <p className="text-gray-500 max-w-sm mx-auto">Não foi possível carregar os dados da planilha de saldos.</p>
      </div>
    );
  }

  // Generate colors for banks
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#84cc16'];

  return (
    <div className="space-y-6">
      <div className="bg-[#121214]/60 border border-white/[0.08] rounded-[24px] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Evolução do Patrimônio Total</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis 
                stroke="rgba(255,255,255,0.2)" 
                tick={{fill: '#9ca3af', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                width={70}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#121214]/60 border border-white/[0.08] rounded-[24px] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Composição por Instituição</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis 
                stroke="rgba(255,255,255,0.2)" 
                tick={{fill: '#9ca3af', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                width={70}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }} 
                onClick={(e) => toggleBank(e.dataKey as string)}
                formatter={(value, entry: any) => (
                  <span style={{ color: hiddenBanks.has(entry.dataKey) ? '#6b7280' : entry.color, cursor: 'pointer', transition: 'color 0.2s' }}>
                    {value}
                  </span>
                )}
              />
              {banks.map((bank, index) => (
                <Line 
                  key={bank} 
                  type="monotone"
                  dataKey={bank} 
                  name={bank} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  hide={hiddenBanks.has(bank)}
                  dot={{ r: 4, fill: '#121214', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BalancesDashboard;
