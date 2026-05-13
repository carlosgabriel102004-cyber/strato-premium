
import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  selectedMonths: string[];
  onMonthsChange: (months: string[]) => void;
  onOpenSources: () => void;
  onOpenManual: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
  activeTab: 'extrato' | 'graficos';
  onTabChange: (tab: 'extrato' | 'graficos') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  selectedMonths, 
  onMonthsChange,
  onOpenSources, 
  onOpenManual,
  isSyncing, 
  onRefresh,
  activeTab,
  onTabChange
}) => {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Gera anos de 2024 até 2070
  const startYear = 2024;
  const endYear = 2070;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const toggleMonth = (mId: string) => {
    if (selectedMonths.includes(mId)) {
      onMonthsChange(selectedMonths.filter(m => m !== mId));
    } else {
      onMonthsChange([...selectedMonths, mId]);
    }
  };

  useEffect(() => {
    // Scroll to current month roughly
    if (scrollRef.current) {
        const currentMonth = new Date().getMonth();
        // Just arbitrarily scroll a little to center if it's later in the year
        if (currentMonth > 5) {
            scrollRef.current.scrollLeft = 300;
        }
    }
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-50 flex flex-col">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <i className="fas fa-wallet text-sm"></i>
            </div>
            <h1 className="text-lg font-semibold text-white hidden lg:block tracking-tight delay-100">Strato</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
              <button 
                onClick={() => onTabChange('extrato')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${activeTab === 'extrato' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <i className="fas fa-list-ul"></i>
                <span className="hidden sm:inline">Extrato</span>
              </button>
              <button 
                onClick={() => onTabChange('graficos')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${activeTab === 'graficos' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <i className="fas fa-chart-pie"></i>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={onRefresh}
            disabled={isSyncing}
            className={`w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-all ${isSyncing ? 'animate-spin text-blue-400' : ''}`}
            title="Sincronizar"
          >
            <i className="fas fa-sync-alt text-sm"></i>
          </button>
          
          <button 
            onClick={onOpenManual}
            className="px-3 sm:px-4 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border border-blue-500/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]"
          >
            <i className="fas fa-plus text-xs"></i>
            <span className="hidden sm:inline">Novo</span>
          </button>

          <button 
            onClick={onOpenSources}
            className="px-3 sm:px-4 py-1.5 bg-white text-black hover:bg-gray-200 rounded-full text-xs sm:text-sm font-medium transition-all shadow-md flex items-center gap-2"
          >
            <i className="fas fa-cog text-xs"></i>
            <span className="hidden lg:inline">Configuração</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-3 flex flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-shrink-0">
             <button 
                onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-200 transition-all backdrop-blur-md h-8"
             >
                <i className="far fa-calendar-alt text-blue-400 mr-1"></i>
                {viewYear}
                <i className={`fas fa-chevron-down text-[10px] opacity-70 transition-transform ml-0.5 ${isYearPickerOpen ? 'rotate-180' : ''}`}></i>
             </button>
             {isYearPickerOpen && (
                <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsYearPickerOpen(false)}></div>
                   <div className="absolute top-full left-0 mt-2 w-24 bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-[60] animate-in fade-in slide-in-from-top-1 duration-150 overflow-y-auto max-h-60 custom-scrollbar">
                     {years.map(y => (
                        <button 
                           key={y} 
                           onClick={() => {
                              setViewYear(y);
                              setIsYearPickerOpen(false);
                           }}
                           className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-white/10 ${viewYear === y ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'}`}
                        >
                           {y}
                        </button>
                     ))}
                   </div>
                </>
             )}
          </div>
          
          <div className="w-[1px] h-4 bg-white/10 flex-shrink-0"></div>

          <div
             ref={scrollRef}
             className="flex items-center p-1 overflow-x-auto no-scrollbar scroll-smooth bg-white/5 rounded-full border border-white/5 backdrop-blur-md w-max"
          >
             {months.map((name, i) => {
                const mId = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
                const isSelected = selectedMonths.includes(mId);
                return (
                   <button
                      key={mId}
                      onClick={() => toggleMonth(mId)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-all ${isSelected ? 'bg-white text-black shadow-sm font-semibold' : 'bg-transparent text-gray-400 hover:text-gray-200 font-medium'}`}
                   >
                     {name}
                   </button>
                );
             })}
          </div>
      </div>
    </header>
  );
};

export default Header;
