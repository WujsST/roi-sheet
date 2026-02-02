"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

import { WeeklySavings } from "@/lib/supabase/types";

interface ChartCardProps {
  data?: WeeklySavings[];
}

export function ChartCard({ data }: ChartCardProps) {
  console.log("ChartCard RENDER:", {
    dataLength: data?.length,
    dataSample: data?.[0],
    fullData: data
  });

  // Limit to last 5 weeks and simplify labels
  const chartData = (data ?? [])
    .slice(-5) // Take only last 5 weeks
    .map((item, index) => ({
      name: `W${index + 1}`, // Simple W1, W2, W3, W4, W5
      saved: Number(item.money_saved_pln ?? 0),
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-text-muted font-mono">Brak danych o oszczędnościach</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-8 relative overflow-hidden">
      <div className="mb-8 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-1 bg-white/20 rounded-full"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted font-mono">Wzrost Oszczędności</span>
        </div>
        <h3 className="text-2xl font-bold text-white font-display">Przegląd Bieżącego Miesiąca</h3>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-3/4 z-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500 }}
              dy={15}
              interval={0}
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
    </div>
  );
}
