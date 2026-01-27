"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Sty", saved: 1200 },
  { name: "Lut", saved: 2100 },
  { name: "Mar", saved: 1800 },
  { name: "Kwi", saved: 4200 },
  { name: "Maj", saved: 5600 },
  { name: "Cze", saved: 7500 },
];

export const SavingsChart = () => {
  return (
    <div className="w-full h-full min-h-[200px] flex flex-col">
        <div className="mb-4">
            <h3 className="font-semibold text-foreground">Przyrost Oszczędności</h3>
            <p className="text-sm text-muted-foreground">Ostatnie 6 miesięcy</p>
        </div>
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
            <defs>
                <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `${value} zł`}
                width={60}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                itemStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
                formatter={(value: number | string | Array<number | string> | undefined) => [value ? `${value} PLN` : '', "Oszczędności"]}
            />
            <Area
                type="monotone"
                dataKey="saved"
                stroke="var(--color-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSaved)"
            />
            </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
