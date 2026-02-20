
import React from 'react';
import { Company, EnergyCategoryValues } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface EnergyAnalyticsProps {
  companies: Company[];
}

const EnergyAnalytics: React.FC<EnergyAnalyticsProps> = ({ companies }) => {
  const highCount = companies.filter(c => c.category === EnergyCategoryValues.HIGH).length;
  const lowCount = companies.filter(c => c.category === EnergyCategoryValues.LOW).length;

  const pieData = [
    { name: '> 1.5 GWh', value: highCount, color: '#f97316' },
    { name: '≤ 1.5 GWh', value: lowCount, color: '#22c55e' }
  ];

  const barData = companies
    .sort((a, b) => b.estimatedConsumptionGWh - a.estimatedConsumptionGWh)
    .slice(0, 8)
    .map(c => ({
      name: c.name.length > 15 ? c.name.substring(0, 12) + '...' : c.name,
      consumption: c.estimatedConsumptionGWh,
      full: c.name
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribuzione Consumi</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Top Consumatori (GWh/anno)</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} />
              <Tooltip 
                cursor={{ fill: '#334155' }}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="consumption" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EnergyAnalytics;
