"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, XCircle, RefreshCw, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface ErrorExecution {
    id: string;
    n8n_workflow_id: string;
    workflow_name?: string | null;
    status: string;
    created_at: string;
    error_message?: string | null;
}

interface WorkflowErrorsAlertProps {
    errors: ErrorExecution[];
    onRefresh?: () => void;
}

export function WorkflowErrorsAlert({ errors, onRefresh }: WorkflowErrorsAlertProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const recentErrors = errors.slice(0, 5);
    const hasErrors = recentErrors.length > 0;

    if (!hasErrors) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-6 relative">
                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                    <AlertTriangle strokeWidth={1} className="w-48 h-48 text-white" />
                </div>
                <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-bold text-white font-display mb-2">Wszystko Działa</h3>
                    <p className="text-sm text-text-muted font-mono">Brak błędów w ostatnich workflow</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-6 relative overflow-hidden">
            {/* Background icon */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                <XCircle strokeWidth={1} className="w-48 h-48 text-red-500" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white font-display">Błędy Workflow</h3>
                        <p className="text-xs text-text-muted font-mono">{recentErrors.length} ostatnich błędów</p>
                    </div>
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="p-2 rounded-full hover:bg-white/5 text-text-muted hover:text-white transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Error List */}
            <div className="flex-1 space-y-2 overflow-y-auto z-10">
                {recentErrors.map((error) => (
                    <div
                        key={error.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-colors"
                    >
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {error.workflow_name || `Workflow ${error.n8n_workflow_id?.slice(0, 8)}...`}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted font-mono">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(error.created_at), { addSuffix: true, locale: pl })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            {errors.length > 5 && (
                <div className="mt-4 pt-4 border-t border-white/5 z-10">
                    <p className="text-xs text-text-muted text-center font-mono">
                        +{errors.length - 5} więcej błędów
                    </p>
                </div>
            )}
        </div>
    );
}
