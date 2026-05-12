import React, { useState } from 'react';

interface AppsScriptModalProps {
  onClose: () => void;
}

const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const code = `function doPost(e) {
  var sheet = SpreadsheetApp.openById("COLOQUE_AQUI_O_ID_DA_SUA_PLANILHA").getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // A, B, C, D, E
  sheet.appendRow([data.data, data.valor, data.descricao, data.conta, data.tipo]);
  
  return ContentService.createTextOutput("Sucesso!").setMimeType(ContentService.MimeType.TEXT);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-semibold text-white">Configurar Automatização Google Sheets</h2>
            <p className="text-sm text-gray-400 mt-1">Siga este passo a passo para enviar lançamentos direto para sua planilha.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <section>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4">
                <h4 className="text-red-400 font-semibold mb-2"><i className="fas fa-exclamation-triangle"></i> Como resolver o erro do Google Drive:</h4>
                <p className="text-sm text-gray-300 mb-2">Este erro da imagem <b>("Não foi possível abrir o arquivo")</b> acontece quando você está logado em várias contas do Google ao mesmo tempo no navegador.</p>
                <ol className="list-decimal ml-5 text-sm text-gray-300 space-y-1">
                  <li>Abra uma <b>Aba Anônima</b> no seu navegador (Ctrl+Shift+N).</li>
                  <li>Faça login <b>apenas</b> com a conta que é dona da sua planilha.</li>
                  <li>Abra sua planilha e tente clicar em <code className="text-indigo-400">Extensões {'>'} Apps Script</code> novamente.</li>
                  <li><i>Alternativa:</i> Acesse direto <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">script.google.com</a>, crie um "Novo Projeto" e no código acima troque <code className="bg-black/30 px-1 rounded text-xs">SpreadsheetApp.getActiveSpreadsheet()</code> por <code className="bg-black/30 px-1 rounded text-xs">SpreadsheetApp.openById("O_ID_DA_SUA_PLANILHA_AQUI")</code>.</li>
                </ol>
              </div>

              <h3 className="text-md font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">1</span> 
                Cole o código abaixo no Apps Script
              </h3>
              <p className="text-sm text-gray-300 ml-8 mb-3">
                Apague todo o código que estiver lá <i>(normalmente `function myFunction() {}`)</i> e cole este:
              </p>
              <div className="ml-8 relative group">
                <pre className="bg-black/50 p-4 rounded-xl text-xs text-gray-300 font-mono overflow-x-auto border border-white/5">
                  {code}
                </pre>
                <button 
                  onClick={copyCode}
                  className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2"
                >
                  <i className={copied ? "fas fa-check text-green-400" : "far fa-copy"}></i>
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-md font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">2</span> 
                Implante como App Web
              </h3>
              <div className="text-sm text-gray-300 ml-8 space-y-2">
                <p>No canto superior direito do Apps Script, clique no botão azul <strong>Implantar</strong> e depois em <strong>Nova implantação</strong>.</p>
                <p>Na janelinha que abrir, clique no ícone de "engrenagem" na esquerda (<i className="fas fa-cog"></i>) e escolha <strong>App da Web</strong>.</p>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 mt-2">
                  <p className="mb-1 text-red-400 font-semibold"><i className="fas fa-exclamation-triangle"></i> IMPORTANTE!</p>
                  <p>No campo "Quem pode acessar", selecione a opção <strong>"Qualquer pessoa"</strong>.</p>
                </div>
                <p>Clique em <strong>Implantar</strong> (O Google vai pedir Autorização. Clique em Advanced/Avançado {'>'} Acessar meu projeto).</p>
              </div>
            </section>

            <section>
              <h3 className="text-md font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">3</span> 
                Cole o link aqui!
              </h3>
              <p className="text-sm text-gray-300 ml-8">
                Copie o link gerado (começa com <code className="text-xs bg-white/10 px-1 rounded">https://script.google.com/macros/s/...</code>) e cole no campo "Apps Script (Webhook)".
              </p>
            </section>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all w-full sm:w-auto text-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppsScriptModal;
