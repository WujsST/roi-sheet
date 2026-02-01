"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import type { MonthlySavings } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";

interface ChartCardProps {
  data?: MonthlySavings[];
}

export function ChartCard({ data }: ChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-text-muted font-mono">Brak danych o oszczędnościach</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    name: item.month_abbr.toUpperCase(),
    saved: Number(item.total_saved)
  }));

  const lastValue = chartData[chartData.length - 1]?.saved ?? 0;

  return (
    <div className="flex h-full flex-col p-8 relative overflow-hidden">
      <div className="mb-8 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-1 bg-white/20 rounded-full"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted font-mono">Wzrost Oszczędności</span>
        </div>
        <h3 className="text-2xl font-bold text-white font-display">Przegląd 6 Miesięcy</h3>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-3/4 z-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#555', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              dy={10}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #333', 
                backgroundColor: '#000',
                color: '#fff',
                fontFamily: 'var(--font-mono)'
              }}
            />
            <Bar 
              dataKey="saved" 
              fill="url(#barGradient)" 
              radius={[4, 4, 0, 0]} 
              barSize={40}
              activeBar={{ fill: '#a78bfa' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Label for last bar */}
      <div className="absolute right-8 top-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow-lg font-mono">
        {formatCurrency(lastValue)} PLN
      </div>
    </div>
  );
}
