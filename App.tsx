
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, AppState, SourceKey } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import SourceManager from './components/SourceManager';
import ManualEntryModal from './components/ManualEntryModal';
import SummaryCards from './components/SummaryCards';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.EMPTY);
  const [activeTab, setActiveTab] = useState<'extrato' | 'graficos'>('extrato');
  
  // 1. Persistência do Período Selecionado
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ff_selected_months');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const d = new Date();
    return [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`];
  });
  
  // 2. Cache de transações (Planilhas remotas)
  const [spreadsheetTransactions, setSpreadsheetTransactions] = useState<Record<string, Transaction[]>>(() => {
    try {
      const saved = localStorage.getItem('ff_sheet_cache');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // 3. Transações Manuais
  const [manualTransactions, setManualTransactions] = useState<Record<string, Transaction[]>>(() => {
    try {
      const saved = localStorage.getItem('ff_manual_txs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // 4. IDs Ignorados
  const [ignoredIds, setIgnoredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ff_ignored_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // 5. Configurações de links por mês
  const [monthConfigs, setMonthConfigs] = useState<Record<string, Record<SourceKey, string>>>(() => {
    try {
      const saved = localStorage.getItem('ff_month_configs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [cardsConfigState, setCardsConfigState] = useState<import('./types').CardConfig[]>([]);

  // Efeitos de Gravação (Salvamento Automático)
  useEffect(() => { localStorage.setItem('ff_selected_months', JSON.stringify(selectedMonths)); }, [selectedMonths]);
  useEffect(() => { localStorage.setItem('ff_month_configs', JSON.stringify(monthConfigs)); }, [monthConfigs]);
  useEffect(() => { localStorage.setItem('ff_manual_txs', JSON.stringify(manualTransactions)); }, [manualTransactions]);
  useEffect(() => { localStorage.setItem('ff_ignored_ids', JSON.stringify(ignoredIds)); }, [ignoredIds]);
  useEffect(() => { localStorage.setItem('ff_sheet_cache', JSON.stringify(spreadsheetTransactions)); }, [spreadsheetTransactions]);

  const allSelectedTransactions = useMemo(() => {
    let combined: Transaction[] = [];
    const seenTxs = new Set<string>();
    
    selectedMonths.forEach(mId => {
      const sheetTxs = spreadsheetTransactions[mId] || [];
      const manuals = manualTransactions[mId] || [];
      const all = [...sheetTxs, ...manuals];
      all.forEach(t => {
        if (!seenTxs.has(t.id)) {
           const dStr = t.paymentDate || t.date;
           const parts = dStr.split('/');
           if (parts.length >= 3) {
             const m = `${parts[2]}-${parts[1]}`;
             if (selectedMonths.includes(m)) {
               seenTxs.add(t.id);
               combined.push(t);
             }
           }
        }
      });
    });
    
    return combined.sort((a, b) => {
      const parseDate = (d: string) => {
        const parts = d.split('/');
        if (parts.length < 3) return 0;
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}`).getTime();
      };
      return parseDate(b.paymentDate || b.date) - parseDate(a.paymentDate || a.date);
    });
  }, [spreadsheetTransactions, manualTransactions, selectedMonths]);

  const activeTransactions = useMemo(() => {
    return allSelectedTransactions.filter(t => !ignoredIds.includes(t.id));
  }, [allSelectedTransactions, ignoredIds]);

  // Cálculo de estatísticas globais para os SummaryCards
  const stats = useMemo(() => {
    const isCredit = (t: Transaction) => {
      const sourceIndicator = `${t.source} ${t.typeTag} ${t.account} ${t.manualSourceLabel}`.toLowerCase();
      return sourceIndicator.includes('cartão') || sourceIndicator.includes('cc');
    };
    
    const isPix = (t: Transaction) => {
      if (isCredit(t)) return false; // Evita que cartões sejam contados como PIX
      const pxIndicator = `${t.source} ${t.typeTag} ${t.description} ${t.account} ${t.manualSourceLabel}`.toLowerCase();
      return pxIndicator.includes('pix');
    };

    const income = activeTransactions.filter(t => t.type === 'income');
    const incomeTotal = income.reduce((sum, t) => sum + t.amount, 0);
    const incomePix = income.filter(isPix).reduce((sum, t) => sum + t.amount, 0);
    const incomeCredit = income.filter(isCredit).reduce((sum, t) => sum + t.amount, 0);

    const expenses = activeTransactions.filter(t => t.type === 'expense');
    const expensesTotal = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expensesPix = expenses.filter(isPix).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expensesCredit = expenses.filter(isCredit).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = incomeTotal - expensesTotal;
    const balancePix = incomePix - expensesPix;
    const balanceCredit = incomeCredit - expensesCredit;

    return { 
      incomeTotal, incomePix, incomeCredit,
      expensesTotal, expensesPix, expensesCredit,
      balance, balancePix, balanceCredit
    };
  }, [activeTransactions]);

  const handleToggleIgnore = (id: string) => {
    setIgnoredIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const parseValue = (valStr: string | number): number => {
    if (valStr === null || valStr === undefined) return NaN;
    let clean = valStr.toString().replace(/[R$\s"]/g, '').trim();
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    return parseFloat(clean);
  };

  const parseCSVLine = (line: string, separator: string): string[] => {
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

  const processCardConfigs = (text: string): import('./types').CardConfig[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const result: import('./types').CardConfig[] = [];
    if (lines.length === 0) return [];
    
    let separator = ',';
    if (lines[0].includes(';')) separator = ';';
    
    // Ignorar cabeçalho sempre
    const headParts = parseCSVLine(lines[0], separator);
    const hasHeader = headParts.length > 1 && isNaN(parseValue(headParts[1]));
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i], separator);
        if (parts.length < 3) continue;

        const name = parts[0];
        const closingDay = parseInt(parts[1], 10);
        const dueDay = parseInt(parts[2], 10);

        if (!name || isNaN(closingDay) || isNaN(dueDay)) continue;

        result.push({ name, closingDay, dueDay });
    }
    return result;
  };

  const processCSV = (text: string, source: SourceKey, cardsConfig: import('./types').CardConfig[] = []): Transaction[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    const result: Transaction[] = [];
    if (lines.length === 0) return [];
    
    let separator = ',';
    if (lines[0].includes(';')) separator = ';';
    
    // Ignorar cabeçalho sempre (temos formato padrão: Data,Valor,Descrição,Conta,Tipo)
    const hasHeader = isNaN(parseValue(parseCSVLine(lines[0], separator)[1]));
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i], separator);
        if (parts.length < 5) continue; // Precisamos de pelo menos 5 colunas

        const dateStr = parts[0];
        let valStr = parts[1];
        let desc = parts[2];
        let account = parts[3];
        let typeTag = parts.slice(4).join(separator); // rest as type e.g., PIX, Cartão

        let amount = parseValue(valStr);

        if (isNaN(amount) || !dateStr || !desc) continue;
        
        // Handling Credit Cards payment Date
        let paymentDate = dateStr;
        if (cardsConfig && cardsConfig.length > 0) {
            const card = cardsConfig.find(c => c.name.toLowerCase() === typeTag.toLowerCase());
            if (card) {
                const dateParts = dateStr.split('/');
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
        
        result.push({
            id: `${source}-${dateStr}-${desc}-${amount}-${i}`,
            date: dateStr,
            amount: amount,
            description: desc,
            account: account,
            typeTag: typeTag,
            type: amount >= 0 ? 'income' : 'expense',
            source: source,
            paymentDate: paymentDate !== dateStr ? paymentDate : undefined
        });
    }
    return result;
  };

  const fetchAllData = useCallback(async (configsOverride?: Record<string, Record<SourceKey, string>>) => {
    if (selectedMonths.length === 0) return;
    setSyncing(true);
    setAppState(AppState.LOADING);
    const targetConfigs = configsOverride || monthConfigs;
    const newSpreadsheetData: Record<string, Transaction[]> = { ...spreadsheetTransactions };

    // Fallback logic: if a month has no config, look for ANY month that has a spreadsheet URL
    let globalFallbackConfig: Record<SourceKey, string> | null = null;
    for (const conf of Object.values(targetConfigs)) {
       if (conf['spreadsheet']) {
          globalFallbackConfig = conf as Record<SourceKey, string>;
          break;
       }
    }

    // Get any cards config from ANY selected month, or the fallback, to apply globally across this fetch
    let cardsConfig: import('./types').CardConfig[] = [];

    const checkConfigs = async (sources: Record<SourceKey, string>) => {
       const cardsUrl = sources['spreadsheet_cards'];
       if (cardsUrl && cardsUrl.startsWith('http') && cardsConfig.length === 0) {
          try {
             let fetchUrl = cardsUrl;
             if (cardsUrl.includes('docs.google.com/spreadsheets')) {
                const idMatch = cardsUrl.match(/\/d\/(.+?)(\/|$)/);
                const gidMatch = cardsUrl.match(/[#&]gid=([0-9]+)/);
                if (idMatch && gidMatch) {
                   fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gidMatch[1]}`;
                } else if (idMatch) {
                   fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
                }
             }
             const response = await fetch(fetchUrl);
             if (response.ok) {
                cardsConfig = processCardConfigs(await response.text());
             }
          } catch (e) { console.error("Error fetching cards", e); }
       }


    }
    
    for (const mId of selectedMonths) {
       await checkConfigs(targetConfigs[mId] || {});
    }
    if (cardsConfig.length === 0 && globalFallbackConfig) {
       await checkConfigs(globalFallbackConfig);
    }
    
    setCardsConfigState(cardsConfig);

    for (const mId of selectedMonths) {
      const sources = targetConfigs[mId] || globalFallbackConfig || {};
      const activeSources = (Object.entries(sources) as [SourceKey, string][])
        .filter(([key, url]) => key !== 'manual' && key !== 'spreadsheet_cards' && key !== 'apps_script' && url && url.startsWith('http'));
      
      let monthTxs: Transaction[] = [];
      for (const [key, url] of activeSources) {
        try {
          let fetchUrl = url;
          if (url.includes('docs.google.com/spreadsheets')) {
            const idMatch = url.match(/\/d\/(.+?)(\/|$)/);
            if (idMatch) {
               // Ignore gid here to default to first sheet which we assume is the transactions sheet
               fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
            }
          }
          const response = await fetch(fetchUrl);
          if (response.ok) {
            const text = await response.text();
            monthTxs = [...monthTxs, ...processCSV(text, key, cardsConfig)];
          }
        } catch (err) { console.error(`Erro ao buscar ${key}:`, err); }
      }
      newSpreadsheetData[mId] = monthTxs;
    }

    setSpreadsheetTransactions(newSpreadsheetData);
    setAppState(AppState.READY);
    setSyncing(false);
  }, [selectedMonths, monthConfigs, spreadsheetTransactions]);

  const handleUpdateSources = (newSources: Record<SourceKey, string>) => {
    if (selectedMonths.length === 0) return;
    const activeM = selectedMonths[0];
    const newConfigs = { ...monthConfigs, [activeM]: newSources };
    setMonthConfigs(newConfigs);
    fetchAllData(newConfigs);
  };

  const handleAddOrEditManual = async (txs: Transaction[]) => {
    let appsScriptUrl = '';
    for (const conf of Object.values(monthConfigs)) {
      if (conf['apps_script']) {
        appsScriptUrl = conf['apps_script'];
        break;
      }
    }

    if (appsScriptUrl) {
      setSyncing(true);
      try {
        setIsManualModalOpen(false); // Close first
        for (const t of txs) {
            const payload = {
                data: t.date,
                valor: t.amount.toFixed(2).replace('.', ','),
                descricao: t.description,
                conta: t.account || 'Outros',
                tipo: t.typeTag || 'Dashboard'
            };

            await fetch(appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            
            // Pausa entre envios se for parcelado, para não sobrecarregar o Apps Script
            if (txs.length > 1) {
                await new Promise(r => setTimeout(r, 800));
            }
        }
        
        // Wait a small delay to allow Google Sheets to append and index
        setTimeout(() => {
            fetchAllData();
            setSyncing(false);
        }, 3000);
        return; // Don't save to local storage since it's going to the sheet
      } catch(e) {
        console.error("Failed to sync with Apps Script, saving locally instead", e);
        setSyncing(false);
      }
    }

    setManualTransactions(prev => {
      const next = { ...prev };
      
      txs.forEach(tx => {
          // If transaction has paymentDate, use it to determine the month!
          const targetDateStr = tx.paymentDate || tx.date;
          const parts = targetDateStr.split('/');
          if (parts.length >= 3) {
             const mId = `${parts[2]}-${parts[1]}`;
             const monthTxs = next[mId] || [];
             const existIdx = monthTxs.findIndex(t => t.id === tx.id);
             if (existIdx >= 0) {
                // Remove existing from where it might be, wait easier just to replace
                monthTxs[existIdx] = tx;
             } else {
                monthTxs.push(tx);
             }
             next[mId] = monthTxs;
          }
      });
      return next;
    });
    setAppState(AppState.READY);
    setEditingTransaction(null);
  };

  useEffect(() => {
    if (selectedMonths.length > 0 && !syncing) {
      fetchAllData();
    }
  }, [selectedMonths]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header 
        selectedMonths={selectedMonths}
        onMonthsChange={setSelectedMonths}
        onOpenSources={() => setIsSourceManagerOpen(true)}
        onOpenManual={() => setIsManualModalOpen(true)}
        isSyncing={syncing}
        onRefresh={() => fetchAllData()}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl pb-32">
        {syncing && (
           <div className="fixed bottom-6 right-6 flex items-center py-3 px-5 bg-[#1c1c1e]/80 backdrop-blur-md border border-white/10 rounded-2xl text-white text-sm font-semibold shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <i className="fas fa-circle-notch fa-spin mr-3 text-indigo-400"></i>
              Sincronizando planilhas remotas...
           </div>
        )}
        
        {selectedMonths.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 text-3xl">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Selecione um período</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Use o seletor no topo para visualizar seus dados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cards de Resumo sempre visíveis */}
            <SummaryCards stats={stats} />
            
            {activeTab === 'graficos' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Dashboard transactions={activeTransactions} />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <TransactionList 
                  transactions={allSelectedTransactions} 
                  ignoredIds={ignoredIds}
                  onToggleIgnore={handleToggleIgnore}
                  onEdit={(tx) => {
                    setEditingTransaction(tx);
                    setIsManualModalOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {isSourceManagerOpen && selectedMonths.length > 0 && (
        <SourceManager 
          onClose={() => setIsSourceManagerOpen(false)} 
          currentSources={monthConfigs[selectedMonths[0]] || { manual: '' } as any}
          onUpdate={handleUpdateSources}
          monthLabel={selectedMonths.join(', ')}
        />
      )}

      {isManualModalOpen && (
        <ManualEntryModal 
          onClose={() => {
            setIsManualModalOpen(false);
            setEditingTransaction(null);
          }}
          onAdd={handleAddOrEditManual}
          editTransaction={editingTransaction}
          cardsConfig={cardsConfigState}
          allTransactions={Object.values(spreadsheetTransactions).flat()}
        />
      )}
    </div>
  );
};

export default App;
