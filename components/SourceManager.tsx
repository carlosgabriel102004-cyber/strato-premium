
import React, { useState } from 'react';
import { SourceKey } from '../types';
import AppsScriptModal from './AppsScriptModal';

interface SourceManagerProps {
  onClose: () => void;
  currentSources: Record<SourceKey, string>;
  onUpdate: (sources: Record<SourceKey, string>) => void;
  monthLabel: string;
}

const SourceManager: React.FC<SourceManagerProps> = ({ onClose, currentSources, onUpdate, monthLabel }) => {
  const [localSources, setLocalSources] = useState(currentSources);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);

  const handleSave = () => {
    onUpdate(localSources);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-medium text-white tracking-tight">Fonte de Dados</h3>
            <p className="text-sm text-gray-400 mt-1">Configuração para o mês de {monthLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 text-sm text-blue-200/80 flex gap-3">
            <i className="fas fa-cloud-download-alt text-lg mt-0.5 text-blue-400"></i>
            <div>
              <p className="font-semibold text-blue-300 mb-1">Como usar a Planilha Única:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Preencha o link "Exportar como CSV" da sua planilha do Google Sheets.</li>
                <li>Padrão: A B C D E (Data, Valor, Descrição, Conta, Tipo).</li>
                <li>O sistema importa automaticamente os dados!</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 group transition-all focus-within:border-white/30 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-green-400">
                  <i className="fas fa-table"></i>
                </div>
                <label className="text-sm font-medium text-gray-200">Google Sheets - Extrato</label>
              </div>
              <input 
                type="url" 
                placeholder="Link da aba extrato. Ex: https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all outline-none"
                value={localSources['spreadsheet'] || ''}
                onChange={(e) => setLocalSources({...localSources, ['spreadsheet']: e.target.value})}
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-purple-400">
                  <i className="fas fa-credit-card"></i>
                </div>
                <label className="text-sm font-medium text-gray-200">Google Sheets - Cartões</label>
              </div>
              <input 
                type="url" 
                placeholder="Link da aba de Cartões. Ex: .../edit#gid=123"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all outline-none"
                value={localSources['spreadsheet_cards'] || ''}
                onChange={(e) => setLocalSources({...localSources, ['spreadsheet_cards']: e.target.value})}
              />
            </div>
            <div className="pt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-rose-400">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <label className="text-sm font-medium text-gray-200">Google Sheets - Assinaturas</label>
              </div>
              <input 
                type="url" 
                placeholder="Link da aba de Assinaturas. Ex: .../edit#gid=456"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all outline-none"
                value={localSources['spreadsheet_subscriptions'] || ''}
                onChange={(e) => setLocalSources({...localSources, ['spreadsheet_subscriptions']: e.target.value})}
              />
            </div>
            <div className="pt-6 border-t border-white/5 pb-2">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                       <i className="fas fa-code"></i>
                    </div>
                    <label className="text-sm font-medium text-gray-200">Apps Script (Webhook)</label>
                 </div>
                 <button 
                    onClick={() => setShowAppsScriptModal(true)}
                    className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors"
                 >
                    Como Configurar?
                 </button>
              </div>
              <input 
                 type="url" 
                 placeholder="Cole aqui o link de implantação gerado pelo Apps Script"
                 className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all outline-none"
                 value={localSources['apps_script'] || ''}
                 onChange={(e) => setLocalSources({...localSources, ['apps_script']: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3 bg-white/5">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-gray-400 hover:text-white rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 px-8 py-3 bg-white text-black text-sm font-medium rounded-xl shadow-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-check"></i>
            Salvar
          </button>
        </div>
      </div>
      
      {showAppsScriptModal && (
        <AppsScriptModal onClose={() => setShowAppsScriptModal(false)} />
      )}
    </div>
  );
};

export default SourceManager;
