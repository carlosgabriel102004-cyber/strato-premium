
import React from 'react';

interface SummaryCardsProps {
  stats: {
    incomeTotal: number;
    incomePix: number;
    incomeCredit: number;
    expensesTotal: number;
    expensesPix: number;
    expensesCredit: number;
    balance: number;
    balancePix: number;
    balanceCredit: number;
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Entradas Card */}
      <div className="glass-card p-6 transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group hover:border-white/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ganhos Gerais</p>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <i className="fas fa-arrow-down pt-1"></i>
          </div>
        </div>
        <p className="text-3xl font-light text-white my-3 tracking-tight">{formatCurrency(stats.incomeTotal)}</p>
        <div className="mt-4 flex gap-4 border-t border-white/5 pt-4">
          <div className="text-xs">
            <span className="text-gray-500 uppercase font-medium mr-1.5">Pix | Débito | Outros:</span>
            <span className="text-gray-200 font-medium">{formatCurrency(stats.incomeTotal)}</span>
          </div>
        </div>
      </div>

      {/* Saídas Card */}
      <div className="glass-card p-6 transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group hover:border-white/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gastos Gerais</p>
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition-colors">
            <i className="fas fa-arrow-up pt-1"></i>
          </div>
        </div>
        <p className="text-3xl font-light text-white my-3 tracking-tight">{formatCurrency(stats.expensesTotal)}</p>
        <div className="mt-4 flex gap-4 border-t border-white/5 pt-4">
          <div className="text-xs">
            <span className="text-gray-500 uppercase font-medium mr-1.5">Pix:</span>
            <span className="text-gray-200 font-medium">{formatCurrency(stats.expensesPix)}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-500 uppercase font-medium mr-1.5">Crédito:</span>
            <span className="text-gray-200 font-medium">{formatCurrency(stats.expensesCredit)}</span>
          </div>
        </div>
      </div>

      {/* Saldo Card */}
      <div className="glass-card p-6 transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group hover:border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Saldo Líquido</p>
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <i className="fas fa-wallet pt-0.5"></i>
          </div>
        </div>
        <p className={`text-3xl font-light my-3 tracking-tight relative z-10 ${stats.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
          {formatCurrency(stats.balance)}
        </p>
        <div className="mt-4 flex gap-4 border-t border-white/5 pt-4 relative z-10">
          <div className="text-xs">
            <span className="text-gray-500 uppercase font-medium mr-1.5">Pix:</span>
            <span className={`${stats.balancePix >= 0 ? 'text-blue-400' : 'text-rose-400'} font-medium`}>{formatCurrency(stats.balancePix)}</span>
          </div>
          <div className="text-xs">
            <span className="text-gray-500 uppercase font-medium mr-1.5">Crédito:</span>
            <span className={`${stats.balanceCredit >= 0 ? 'text-blue-400' : 'text-rose-400'} font-medium`}>{formatCurrency(stats.balanceCredit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
