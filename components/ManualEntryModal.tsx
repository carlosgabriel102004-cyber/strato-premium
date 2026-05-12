
import React, { useState, useEffect } from 'react';
import { Transaction, SourceKey } from '../types';

interface ManualEntryModalProps {
  onClose: () => void;
  onAdd: (txs: Transaction[]) => void;
  editTransaction?: Transaction | null;
  cardsConfig?: import('../types').CardConfig[];
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onAdd, editTransaction, cardsConfig = [] }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Dinheiro');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [installments, setInstallments] = useState(1);

  // Combine standard options with card options
  const defaultSources = ['Dinheiro', 'PIX', 'Nubank PJ', 'Nubank PF', 'PicPay PF', 'PicPay PJ', 'Outros'];
  const cardNames = cardsConfig.map(c => c.name);
  const sourceOptions = Array.from(new Set([...defaultSources, ...cardNames]));

  useEffect(() => {
    if (editTransaction) {
      const [d, m, y] = editTransaction.date.split('/');
      setDate(`${y}-${m}-${d}`);
      setDescription(editTransaction.description);
      setAmount(Math.abs(editTransaction.amount).toString());
      
      const src = editTransaction.typeTag || editTransaction.manualSourceLabel || 'Dinheiro';
      if (!sourceOptions.includes(src)) {
         sourceOptions.push(src);
      }
      setSourceLabel(src);
      setType(editTransaction.type);
      setInstallments(1); // Cannot edit installments
    }
  }, [editTransaction]);

  const calculatePaymentDate = (dString: string, typeTag: string) => {
     let paymentDate = dString;
     if (cardsConfig && cardsConfig.length > 0) {
         const card = cardsConfig.find(c => c.name.toLowerCase() === typeTag.toLowerCase());
         if (card) {
             const dateParts = dString.split('/');
             if (dateParts.length === 3) {
                 const day = parseInt(dateParts[0], 10);
                 let month = parseInt(dateParts[1], 10);
                 let year = parseInt(dateParts[2], 10);

                 if (day >= card.closingDay) {
                     month += 1;
                     if (month > 12) {
                         month = 1;
                         year += 1;
                     }
                 }
                 paymentDate = `${String(card.dueDay).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
             }
         }
     }
     return paymentDate;
  };

  const addMonths = (dateStr: string, monthsToAdd: number) => {
     const [year, month, day] = dateStr.split('-');
     const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
     d.setMonth(d.getMonth() + monthsToAdd);
     const y = d.getFullYear();
     const m = String(d.getMonth() + 1).padStart(2, '0');
     const dDay = String(d.getDate()).padStart(2, '0');
     return `${dDay}/${m}/${y}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const numAmount = Math.abs(parseFloat(amount));
    const finalTotalAmount = type === 'expense' ? -numAmount : numAmount;

    if (editTransaction || installments <= 1) {
       const finalDString = date.split('-').reverse().join('/');
       const pDate = calculatePaymentDate(finalDString, sourceLabel);
       const newTx: Transaction = {
         id: editTransaction ? editTransaction.id : `manual-${Date.now()}`,
         date: finalDString,
         description: description,
         amount: finalTotalAmount,
         category: editTransaction?.category || 'Manual',
         type: type,
         source: editTransaction ? editTransaction.source : 'manual',
         manualSourceLabel: sourceLabel,
         typeTag: sourceLabel,
         paymentDate: pDate !== finalDString ? pDate : undefined
       };
       onAdd([newTx]);
    } else {
       // Handle multiple parcels
       const amountPerParcel = parseFloat((finalTotalAmount / installments).toFixed(2));
       const txs: Transaction[] = [];
       
       for (let i = 0; i < installments; i++) {
          const installmentDateStr = addMonths(date, i); // e.g. "04/05/2026"
          const pDate = calculatePaymentDate(installmentDateStr, sourceLabel);
          
          txs.push({
             id: `manual-${Date.now()}-${i}`,
             date: installmentDateStr,
             description: `${description} (${i + 1}/${installments})`,
             amount: i === installments - 1 ? finalTotalAmount - (amountPerParcel * (installments - 1)) : amountPerParcel, 
             category: 'Manual',
             type: type,
             source: 'manual',
             manualSourceLabel: sourceLabel,
             typeTag: sourceLabel,
             paymentDate: pDate !== installmentDateStr ? pDate : undefined 
          });
       }
       onAdd(txs);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{editTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <p className="text-sm text-slate-500">{editTransaction ? 'Ajuste os dados da transação' : 'Adicione um gasto ou ganho manual'}</p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
              <button 
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
              >
                Saída
              </button>
              <button 
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              >
                Entrada
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fonte</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-medium text-slate-700"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  disabled={editTransaction && editTransaction.source !== 'manual'}
                >
                  {sourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Parcelas</label>
                <input 
                  type="number" 
                  min="1"
                  max="48"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:opacity-50"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  disabled={!!editTransaction}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  required
                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
              <input 
                type="text" 
                placeholder="Ex: Almoço no quilo, Pagamento João..."
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-100">
            <button 
              type="submit"
              className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {editTransaction ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
