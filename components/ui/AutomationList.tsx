"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Automation {
    id: string;
    name: string;
    client: string;
    status: "healthy" | "error" | "warning";
    lastRun: string;
}

const automations: Automation[] = [
    { id: "1", name: "Invoice Processing", client: "TechCorp", status: "healthy", lastRun: "12 min ago" },
    { id: "2", name: "Lead Scoring", client: "SalesFlow", status: "healthy", lastRun: "45 min ago" },
    { id: "3", name: "Social Media Sync", client: "BrandBoost", status: "warning", lastRun: "2h ago" },
    { id: "4", name: "Daily Reporting", client: "DataWiz", status: "healthy", lastRun: "5h ago" },
    { id: "5", name: "Email Outreach", client: "GrowthHacker", status: "error", lastRun: "1d ago" },
];

export const AutomationList = () => {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <h3 className="font-semibold text-foreground mb-4 px-2">Aktywne Automatyzacje</h3>
            <div className="overflow-auto flex-1 -mx-2 px-2">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-gray-50/50 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Nazwa</th>
                            <th className="px-4 py-3">Klient</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Ostatnie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {automations.map((item) => (
                            <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">{item.client}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'healthy' && <CheckCircle2 size={16} className="text-green-500" />}
                                        {item.status === 'warning' && <AlertCircle size={16} className="text-yellow-500" />}
                                        {item.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                                        <span className={cn(
                                            "capitalize text-xs font-medium",
                                            item.status === 'healthy' && "text-green-700",
                                            item.status === 'warning' && "text-yellow-700",
                                            item.status === 'error' && "text-red-700"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-muted-foreground flex items-center justify-end gap-1">
                                    <Clock size={14} />
                                    {item.lastRun}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
