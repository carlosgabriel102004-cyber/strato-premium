
import React, { useState, useEffect } from 'react';
import { Transaction, SourceKey } from '../types';

interface ManualEntryModalProps {
  onClose: () => void;
  onAdd: (txs: Transaction[]) => void;
  editTransaction?: Transaction | null;
  cardsConfig?: import('../types').CardConfig[];
  knownAccounts?: string[];
  knownTypes?: string[];
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onAdd, editTransaction, cardsConfig = [], knownAccounts = [], knownTypes = [] }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  
  // Create account Options array from the ones passed
  const accountOptions = Array.from(new Set( [...knownAccounts].filter(Boolean) ));
  if (accountOptions.length === 0) {
      accountOptions.push('Nubank PF', 'Outros');
  }

  // Create type Options array from the ones passed
  const cardNames = cardsConfig.map(c => c.name);
  const typeOptions = Array.from(new Set( [...knownTypes, ...cardNames].filter(Boolean) ));
  if (typeOptions.length === 0) {
      typeOptions.push('Cartão Nubank', 'PIX');
  }

  const [account, setAccount] = useState(accountOptions.includes(editTransaction?.account || '') ? editTransaction!.account : accountOptions[0]);
  const [typeTag, setTypeTag] = useState(typeOptions.includes(editTransaction?.typeTag || '') ? editTransaction!.typeTag : typeOptions[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [installments, setInstallments] = useState(1);


  useEffect(() => {
    if (editTransaction) {
      const [d, m, y] = editTransaction.date.split('/');
      setDate(`${y}-${m}-${d}`);
      setDescription(editTransaction.description);
      setAmount(Math.abs(editTransaction.amount).toString());
      
      const acc = editTransaction.account || 'Mercado Pago';
      if (!accountOptions.includes(acc)) {
         accountOptions.push(acc);
      }
      setAccount(acc);
      
      const typ = editTransaction.typeTag || 'PIX';
      if (!typeOptions.includes(typ)) {
         typeOptions.push(typ);
      }
      setTypeTag(typ);
      
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
       const pDate = calculatePaymentDate(finalDString, typeTag);
       const newTx: Transaction = {
         id: editTransaction ? editTransaction.id : `manual-${Date.now()}`,
         date: finalDString,
         description: description,
         amount: finalTotalAmount,
         category: editTransaction?.category || 'Manual',
         type: type,
         source: editTransaction ? editTransaction.source : 'manual',
         account: account,
         typeTag: typeTag,
         manualSourceLabel: undefined,
         paymentDate: pDate !== finalDString ? pDate : undefined
       };
       onAdd([newTx]);
    } else {
       // Handle multiple parcels
       const amountPerParcel = parseFloat((finalTotalAmount / installments).toFixed(2));
       const txs: Transaction[] = [];
       
       for (let i = 0; i < installments; i++) {
          const installmentDateStr = addMonths(date, i); // e.g. "04/05/2026"
          const finalDString = installmentDateStr;
          const pDate = calculatePaymentDate(installmentDateStr, typeTag);
          
          txs.push({
             id: `manual-${Date.now()}-${i}`,
             date: finalDString,
             description: `${description} (${i + 1}/${installments})`,
             amount: i === installments - 1 ? finalTotalAmount - (amountPerParcel * (installments - 1)) : amountPerParcel, 
             category: 'Manual',
             type: type,
             source: 'manual',
             account: account,
             typeTag: typeTag,
             manualSourceLabel: undefined,
             paymentDate: pDate !== finalDString ? pDate : undefined 
          });
       }
       onAdd(txs);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#121214]/60 border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-[40px] rounded-[32px] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-[22px] font-bold text-white tracking-tight">{editTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <p className="text-sm text-gray-400/80 font-medium mt-0.5">{editTransaction ? 'Ajuste os dados da transação' : 'Adicione um gasto ou ganho manual'}</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex bg-black/40 p-1.5 rounded-[18px] mb-1 shadow-inner ring-1 ring-white/5">
              <button 
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${type === 'expense' ? 'bg-[#ff3b5c]/15 text-[#ff3b5c] shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Saída
              </button>
              <button 
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${type === 'income' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                Entrada
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Data</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-[15px] font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/10 transition-all outline-none [color-scheme:dark]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Valor Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  required
                  className={`w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-lg font-bold focus:ring-1 focus:ring-white/20 focus:border-white/10 transition-all outline-none ${type === 'expense' ? 'text-white' : 'text-white'}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Banco / Conta</label>
                <select 
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-[15px] font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/10 transition-all outline-none appearance-none"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                >
                  {accountOptions.map(opt => (
                    <option key={`acc-${opt}`} value={opt} className="bg-[#1c1c1e] text-white">{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo / Cartão</label>
                <select 
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-[15px] font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/10 transition-all outline-none appearance-none"
                  value={typeTag}
                  onChange={(e) => setTypeTag(e.target.value)}
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '1em' }}
                >
                  {typeOptions.map(opt => (
                    <option key={`type-${opt}`} value={opt} className="bg-[#1c1c1e] text-white">{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Parcelas</label>
                <input 
                  type="number" 
                  min="1"
                  max="48"
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-[15px] font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/10 transition-all outline-none disabled:opacity-30"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  disabled={!!editTransaction}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descrição</label>
              <input 
                type="text" 
                placeholder="Ex: Almoço no quilo, Pagamento João..."
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-[15px] font-medium text-white focus:ring-1 focus:ring-white/20 focus:border-white/10 transition-all outline-none placeholder-gray-500/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 pt-2">
            <button 
              type="submit"
              className={`w-full py-4 text-[15px] text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(255,59,92,0.25)] transition-all transform hover:scale-[1.02] active:scale-[0.98] ${type === 'expense' ? 'bg-[#ff3b5c] hover:bg-[#ff4f6d]' : 'bg-[#34c759] hover:bg-[#3ddc62] shadow-[0_8px_20px_rgba(52,199,89,0.25)]'}`}
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
