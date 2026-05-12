
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

                 let paymentMonth = month;
                 let paymentYear = year;

                 if (day >= card.closingDay) {
                     paymentMonth += 1;
                 }
                 if (card.dueDay < card.closingDay) {
                     paymentMonth += 1;
                 }
                 
                 while (paymentMonth > 12) {
                     paymentMonth -= 12;
                     paymentYear += 1;
                 }
                 paymentDate = `${String(card.dueDay).padStart(2, '0')}/${String(paymentMonth).padStart(2, '0')}/${paymentYear}`;
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
         date: pDate,
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
             date: pDate,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{editTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <p className="text-sm text-gray-400">{editTransaction ? 'Ajuste os dados da transação' : 'Adicione um gasto ou ganho manual'}</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-2 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex bg-[#252528] p-1 rounded-xl mb-2">
              <button 
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                Saída
              </button>
              <button 
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                Entrada
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Data</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-2.5 bg-[#252528] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none [color-scheme:dark]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Fonte</label>
                <select 
                  className="w-full px-4 py-2.5 bg-[#252528] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none font-medium"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  disabled={!!editTransaction && editTransaction.source !== 'manual'}
                >
                  {sourceOptions.map(opt => (
                    <option key={opt} value={opt} className="bg-[#252528]">{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Parcelas</label>
                <input 
                  type="number" 
                  min="1"
                  max="48"
                  className="w-full px-4 py-2.5 bg-[#252528] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none disabled:opacity-50"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  disabled={!!editTransaction}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Valor Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  required
                  className={`w-full px-4 py-2.5 bg-[#252528] border border-white/10 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
              <input 
                type="text" 
                placeholder="Ex: Almoço no quilo, Pagamento João..."
                required
                className="w-full px-4 py-2.5 bg-[#252528] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none placeholder-gray-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
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
