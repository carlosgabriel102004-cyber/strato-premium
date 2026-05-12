
import React, { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonths: string[];
  onMonthToggle: (mId: string) => void;
  onSelectAll: (months: string[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, selectedMonths, onMonthToggle, onSelectAll }) => {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const allSelectedYearMonths = months.map((_, i) => `${viewYear}-${String(i + 1).padStart(2, '0')}`);

  return (
    <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r border-slate-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-xl font-black text-indigo-600 uppercase tracking-tighter">Strato</span>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 space-y-1">
          {/* Seletor de Ano na Sidebar */}
          <div className="flex items-center justify-between px-3 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <button 
              onClick={() => setViewYear(prev => Math.max(2024, prev - 1))} 
              className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
              disabled={viewYear <= 2024}
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <span className="text-sm font-black text-slate-700 tracking-widest">{viewYear}</span>
            <button 
              onClick={() => setViewYear(prev => Math.min(2070, prev + 1))} 
              className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
              disabled={viewYear >= 2070}
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>

          <button 
            onClick={() => onSelectAll(allSelectedYearMonths)}
            className="w-full flex items-center p-2 text-sm font-bold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors group mb-4 bg-indigo-50 border border-indigo-100"
          >
            <i className="fas fa-calendar-check text-indigo-600 mr-3"></i>
            Selecionar Todo {viewYear}
          </button>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">MESES</div>
          {months.map((name, i) => {
            const mId = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
            const isSelected = selectedMonths.includes(mId);
            return (
              <button
                key={mId}
                onClick={() => onMonthToggle(mId)}
                className={`w-full flex items-center justify-between p-2.5 text-sm rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex items-center">
                  <i className={`fas fa-calendar-day mr-3 ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}></i>
                  {name}
                </span>
                {isSelected && <i className="fas fa-check-circle text-[10px]"></i>}
              </button>
            );
          })}
        </div>

        <div className="mt-auto p-2 bg-slate-50 rounded-xl">
          <p className="text-[10px] text-slate-400 font-medium text-center italic">Versão 2.1 • Strato Pro</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
