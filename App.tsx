
import React, { useState, useEffect } from 'react';
import { Company, SearchFilters, ApiConfig } from './types';
import { inference } from './services/geminiService';
import SearchBar from './components/SearchBar';
import CompanyList from './components/CompanyList';
import EnergyAnalytics from './components/EnergyAnalytics';
import LiveAssistant from './components/LiveAssistant';
import ChatBot from './components/ChatBot';
import { BrainCircuit, Database, Activity, ClipboardList, Send, Coins, ShieldCheck, Cpu, Settings2, X, ShieldAlert, Download, PlusCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{message: string, type: 'general' | 'quota'} | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'paste'>('list');
  const [rawInput, setRawInput] = useState('');
  const [lastFilters, setLastFilters] = useState<SearchFilters | null>(null);
  
  const [showConfig, setShowConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('api_config');
    return saved ? JSON.parse(saved) : { provider: 'gemini', apiKey: '' };
  });

  useEffect(() => {
    localStorage.setItem('api_config', JSON.stringify(apiConfig));
  }, [apiConfig]);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setCompanies([]);
    setLastFilters(filters);
    
    try {
      const results = await inference.searchCompanies(filters);
      setCompanies(results);
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") {
        setError({ message: `Quota esaurita su ${apiConfig.provider}. Passa all'altro provider o attendi.`, type: 'quota' });
      } else {
        setError({ message: err.message || "Errore di elaborazione.", type: 'general' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMore = async () => {
    if (!lastFilters || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    
    try {
      // Passiamo i nomi delle aziende già trovate per escluderle nel prossimo prompt
      const existingNames = companies.map(c => c.name);
      const newResults = await inference.searchCompanies(lastFilters, existingNames);
      
      if (newResults.length === 0) {
        setError({ message: "L'IA non ha trovato altre aziende rilevanti in questa zona con i criteri attuali.", type: 'general' });
      } else {
        setCompanies(prev => [...prev, ...newResults]);
      }
    } catch (err: any) {
      setError({ message: "Errore durante il recupero di nuovi risultati.", type: 'general' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePasteProcess = async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await inference.processRawData(rawInput);
      setCompanies(results);
      setActiveTab('list');
      setRawInput('');
    } catch (err: any) {
      setError({ message: err.message === "QUOTA_EXHAUSTED" ? "Quota esaurita." : "Errore parsing.", type: 'general' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="bg-slate-900/95 border-b border-white/5 p-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl shadow-lg transition-all ${apiConfig.provider === 'cerebras' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
              {apiConfig.provider === 'cerebras' ? <Cpu className="text-white" size={24} /> : <BrainCircuit className="text-white" size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Industrial AI</h1>
                <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black tracking-widest uppercase ${apiConfig.provider === 'cerebras' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {apiConfig.provider === 'cerebras' ? 'Cerebras Llama 3.3' : 'Google Gemini 3'}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Lombardy Energy Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchBar onSearch={handleSearch} isLoading={loading} />
            <button 
              onClick={() => setShowConfig(true)}
              className="p-2.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500 transition-all"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* API Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Configurazione AI</h2>
              <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Provider AI</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setApiConfig({...apiConfig, provider: 'gemini'})}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${apiConfig.provider === 'gemini' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-transparent text-slate-500'}`}
                  >
                    <BrainCircuit size={20} />
                    <span className="text-[10px] font-bold">Google Gemini</span>
                  </button>
                  <button 
                    onClick={() => setApiConfig({...apiConfig, provider: 'cerebras'})}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${apiConfig.provider === 'cerebras' ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'bg-slate-800 border-transparent text-slate-500'}`}
                  >
                    <Cpu size={20} />
                    <span className="text-[10px] font-bold">Cerebras (Llama)</span>
                  </button>
                </div>
              </div>
              {apiConfig.provider === 'cerebras' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Chiave API {apiConfig.provider.toUpperCase()}</label>
                  <input 
                    type="password"
                    value={apiConfig.apiKey}
                    onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                    placeholder="Inserisci la chiave..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}
              {apiConfig.provider === 'gemini' && (
                <p className="text-[10px] text-slate-500 italic">La chiave Gemini è gestita in modo sicuro dal sistema.</p>
              )}
              <button 
                onClick={() => setShowConfig(false)}
                className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all"
              >
                Salva e Applica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900/60 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-3xl backdrop-blur-md">
            <div className="flex border-b border-white/5 bg-white/5">
              <button onClick={() => setActiveTab('list')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500' : 'text-slate-500'}`}>
                <Database className="inline mr-2" size={14} /> Database ({companies.length})
              </button>
              <button onClick={() => setActiveTab('analytics')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500' : 'text-slate-500'}`}>
                <Activity className="inline mr-2" size={14} /> Analytics
              </button>
              <button onClick={() => setActiveTab('paste')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'paste' ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500' : 'text-slate-500'}`}>
                <ClipboardList className="inline mr-2" size={14} /> Scraper Manuale
              </button>
            </div>

            <div className="p-8 min-h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className={`h-20 w-20 rounded-full border-t-2 animate-spin ${apiConfig.provider === 'cerebras' ? 'border-orange-500' : 'border-emerald-500'}`}></div>
                  <p className="text-lg font-black italic text-white animate-pulse">
                    {apiConfig.provider === 'cerebras' ? 'Deep Scanning Cerebras...' : 'Analisi Territoriale Gemini...'}
                  </p>
                </div>
              ) : error?.type === 'quota' ? (
                <div className="flex flex-col items-center justify-center py-24 text-center p-8 bg-orange-500/5 rounded-[2rem] border border-orange-500/20">
                  <ShieldAlert size={64} className="text-orange-500 mb-6" />
                  <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">Quota Esaurita</h3>
                  <p className="text-sm text-slate-400 max-w-md mb-8">{error.message}</p>
                  <button onClick={() => setShowConfig(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Cambia Provider / Key</button>
                </div>
              ) : activeTab === 'paste' ? (
                <div className="space-y-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
                    <h3 className="text-emerald-400 font-black text-xs uppercase mb-3 flex items-center gap-2">
                      <ClipboardList size={16} /> Estrazione Intelligente
                    </h3>
                    <textarea 
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder="Incolla nomi di aziende, indirizzi o frammenti di database..."
                      className="w-full h-48 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button 
                      onClick={handlePasteProcess}
                      className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                    >
                      <Send size={14} /> Elabora con {apiConfig.provider === 'cerebras' ? 'Llama 3.3' : 'Gemini'}
                    </button>
                  </div>
                </div>
              ) : companies.length > 0 ? (
                <div className="animate-in fade-in">
                  {activeTab === 'list' ? <CompanyList companies={companies} /> : <EnergyAnalytics companies={companies} />}
                  
                  <div className="flex flex-col items-center gap-6 mt-12 pb-8">
                    <div className="flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={handleSearchMore}
                        disabled={loadingMore}
                        className={`group relative overflow-hidden bg-slate-900 border border-emerald-500/30 text-emerald-400 px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:border-emerald-400 transition-all flex items-center gap-3 shadow-2xl shadow-emerald-500/10 ${loadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loadingMore ? <RefreshCw size={16} className="animate-spin" /> : <PlusCircle size={16} className="group-hover:rotate-90 transition-transform" />}
                        {loadingMore ? 'Scansione in corso...' : 'Cerca Ancora Lead'}
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </button>

                      <button onClick={() => {
                          const headers = ["Nome", "P.IVA", "Indirizzo", "Citta", "Settore", "Consumo GWh"];
                          const rows = companies.map(c => [c.name, c.vatNumber || 'N/A', c.address, c.city, c.industry, c.estimatedConsumptionGWh]);
                          const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `leads_audit_${lastFilters?.city || 'lombardia'}.csv`;
                          a.click();
                        }} 
                        className="bg-white text-black px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-3">
                        <Download size={16} /> Esporta {companies.length} Lead
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Database size={12} /> Database aggiornato con {companies.length} aziende uniche
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center">
                  {apiConfig.provider === 'cerebras' ? <Cpu size={80} className="mb-6" /> : <BrainCircuit size={80} className="mb-6" />}
                  <p className="text-xl font-black uppercase italic">In attesa di istruzioni</p>
                  <p className="text-xs max-w-xs mt-2">Cerca un comune in Lombardia per generare lead industriali.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem]">
              <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Coins size={14} /> Deep Retrieval
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">Il tasto "Cerca Ancora" utilizza una memoria di sessione per evitare duplicati. Ogni iterazione approfondisce la ricerca esplorando nuove zone del comune selezionato.</p>
            </div>
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem]">
              <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={14} /> Accuratezza Dati
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">I dati sono estratti da modelli addestrati su registri industriali e mappe. I consumi energetici sono stime basate sull'algoritmo di audit sintetico dell'IA.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <LiveAssistant />
          <ChatBot />
        </div>
      </main>
    </div>
  );
};

export default App;
