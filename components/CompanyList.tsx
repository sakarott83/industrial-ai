
import React from 'react';
import { Company } from '../types';
import { Building2, Zap, ExternalLink, MapPin, Phone, Mail, Store, Hotel, Utensils, Coffee } from 'lucide-react';

interface CompanyListProps {
  companies: Company[];
}

const getIndustryIcon = (industry: string) => {
  const ind = industry.toLowerCase();
  if (ind.includes('hotel') || ind.includes('albergo')) return <Hotel size={18} />;
  if (ind.includes('ristorante') || ind.includes('pizza') || ind.includes('food')) return <Utensils size={18} />;
  if (ind.includes('bar') || ind.includes('caffè') || ind.includes('coffee')) return <Coffee size={18} />;
  if (ind.includes('supermercato') || ind.includes('gdo') || ind.includes('negozio')) return <Store size={18} />;
  return <Building2 size={18} />;
};

const CompanyList: React.FC<CompanyListProps> = ({ companies }) => {
  // We don't re-sort here because the parent already handles sorting or accumulation order
  return (
    <div className="space-y-3">
      {companies.map((company, idx) => (
        <div 
          key={idx} 
          className={`bg-slate-900/40 border ${company.category === 'HIGH' ? 'border-orange-500/20 bg-orange-500/5' : 'border-slate-800'} p-4 rounded-xl hover:bg-slate-800/60 transition-all flex flex-col lg:flex-row justify-between gap-4`}
        >
          <div className="flex gap-4 items-start flex-1">
            <div className={`p-2.5 rounded-lg shrink-0 ${company.category === 'HIGH' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
              {getIndustryIcon(company.industry)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-100 truncate text-sm sm:text-base">
                {company.name}
              </h3>
              <div className="flex items-center gap-1 text-slate-500 text-[11px] mb-1">
                <MapPin size={10} /> <span className="truncate">{company.address}, {company.city}</span>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-2">
                {company.phone && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <Phone size={10} className="text-blue-500" /> {company.phone}
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <Mail size={10} className="text-blue-500" /> {company.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Zap size={14} className={company.category === 'HIGH' ? 'text-orange-500' : 'text-green-500'} />
                <span className="text-lg font-black text-slate-100 leading-none">{company.estimatedConsumptionGWh.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">GWh</span>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-tighter ${company.category === 'HIGH' ? 'text-orange-500' : 'text-green-600/70'}`}>
                {company.category === 'HIGH' ? 'Energivoro' : 'Standard'}
              </p>
            </div>
            
            {company.website && (
              <a 
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-lg transition-all"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompanyList;
