
import React, { useState } from 'react';
import { SearchFilters } from '../types';
import { Search, BrainCircuit } from 'lucide-react';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
}

const LOMBARDY_PROVINCES = [
  "Bergamo", "Brescia", "Como", "Cremona", "Lecco", "Lodi", "Mantova", 
  "Milano", "Monza e della Brianza", "Pavia", "Sondrio", "Varese"
];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [province, setProvince] = useState('Milano');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ province, city: city || province });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
      <div className="relative flex-1">
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full bg-transparent text-slate-200 pl-4 pr-8 py-2.5 rounded-xl focus:outline-none appearance-none text-xs font-black uppercase tracking-widest cursor-pointer"
        >
          {LOMBARDY_PROVINCES.map(p => (
            <option key={p} value={p} className="bg-slate-900 text-slate-200">{p}</option>
          ))}
        </select>
      </div>
      
      <div className="relative flex-[1.5]">
        <input
          type="text"
          placeholder="Cerca in un Comune specifico..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-slate-800/30 border border-white/5 text-slate-200 px-5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs placeholder:text-slate-600"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[9px] tracking-[0.2em] shadow-lg shadow-cyan-900/20"
      >
        {isLoading ? (
          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <BrainCircuit size={14} />
        )}
        Genera Lead AI
      </button>
    </form>
  );
};

export default SearchBar;
