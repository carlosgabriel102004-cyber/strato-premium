
import React, { useState } from 'react';
import { Transaction, SourceKey } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  ignoredIds: string[];
  onToggleIgnore: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  nubank_pj_pix: 'Nubank PJ',
  nubank_pf_pix: 'Nubank PF',
  nubank_cc: 'Nubank CC',
  picpay_pf_pix: 'PicPay PF',
  picpay_pj_pix: 'PicPay PJ',
  mercado_pago: 'Mercado Pago',
  manual: 'Manual'
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, ignoredIds, onToggleIgnore, onEdit }) => {
  const [filter, setFilter] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(filter.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(filter.toLowerCase()))
  );

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
    return isNegative ? `-${formatted}` : formatted;
  };

return (
    <div className="glass-card flex flex-col relative mb-4">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Histórico de Lançamentos</h3>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input 
            type="text" 
            placeholder="Buscar lançamentos..."
            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-white/30 text-white placeholder-gray-500 w-full sm:w-64 transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-white/5 text-gray-400 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap">Data</th>
              <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap">Conta / Tipo</th>
              <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Descrição</th>
              <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wider text-right">Valor</th>
              <th className="px-6 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length > 0 ? filtered.map((t, index) => {
              const isIgnored = ignoredIds.includes(t.id);
              const isLastRows = index >= filtered.length - 3 && filtered.length > 3;

              return (
                <tr 
                  key={t.id} 
                  className={`transition-colors relative group ${isIgnored ? 'bg-white/5 italic opacity-50' : 'hover:bg-white/5'}`}
                >
                  <td className={`px-6 py-4 whitespace-nowrap`}>
                    <div className="flex flex-col justify-center">
                        <span className={`text-xs font-mono ${isIgnored ? 'text-gray-500' : 'text-gray-300'}`}>
                           {t.date}
                        </span>
                        {t.paymentDate && t.paymentDate !== t.date && (
                           <span className="text-[10px] text-blue-400 font-medium mt-1 inline-flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded">
                             <i className="fas fa-flag text-[8px] opacity-70"></i>
                             Vence: {t.paymentDate}
                           </span>
                        )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap`}>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-200">{t.account || t.source}</span>
                        <span className="text-[10px] text-gray-500">{t.typeTag}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-medium text-sm max-w-xs truncate ${isIgnored ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {t.description}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium text-sm ${isIgnored ? 'text-gray-600 line-through' : t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' && !isIgnored ? '+' : ''} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-gray-400 transition-all focus:outline-none"
                      >
                        <i className="fas fa-ellipsis-h text-xs"></i>
                      </button>
                      
                      {openMenuId === t.id && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setOpenMenuId(null)}></div>
                          <div className={`absolute right-0 w-48 bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[70] py-2 animate-in fade-in zoom-in-95 duration-150 ${isLastRows ? 'bottom-full mb-2' : 'mt-2'}`}>
                            <button 
                              onClick={() => {
                                onEdit(t);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-300 hover:bg-white/10 flex items-center gap-3 transition-colors"
                            >
                              <i className="fas fa-edit text-blue-400 w-4"></i>
                              Editar Lançamento
                            </button>
                            <button 
                              onClick={() => {
                                onToggleIgnore(t.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-300 hover:bg-white/10 flex items-center gap-3 transition-colors border-t border-white/5 mt-1"
                            >
                              <i className={isIgnored ? "fas fa-check-circle text-emerald-400 w-4" : "fas fa-eye-slash text-gray-400 w-4"}></i>
                              {isIgnored ? 'Reconsiderar' : 'Desconsiderar'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-500 italic font-medium">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
