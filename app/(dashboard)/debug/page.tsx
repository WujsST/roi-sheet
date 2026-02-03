"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function runDebug() {
            const supabase = createClient();
            const now = new Date();

            // 1. Check RPC
            const rpcResult = await supabase.rpc('get_monthly_savings_chart', {
                p_year: now.getFullYear(),
                p_month: now.getMonth() + 1,
                p_client_id: null
            });

            // 2. Check Raw Executions
            const executionsResult = await supabase
                .from('executions_raw')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            // 3. Check Automations
            const automationsResult = await supabase
                .from('automations')
                .select('id, name, n8n_workflow_id, seconds_saved_per_execution, hourly_rate')
                .limit(5);

            setData({
                rpc: rpcResult,
                executions: executionsResult,
                automations: automationsResult,
                params: { year: now.getFullYear(), month: now.getMonth() + 1 }
            });
            setLoading(false);
        }

        runDebug();
    }, []);

    if (loading) return <div className="p-10 text-white">Loading debug data...</div>;

    return (
        <div className="p-10 bg-black min-h-screen text-white font-mono text-xs">
            <h1 className="text-xl font-bold mb-4">Debug Console</h1>

            <div className="grid grid-cols-3 gap-8">
                <section>
                    <h2 className="text-green-400 font-bold mb-2">RPC Result (Chart Data)</h2>
                    <pre className="bg-gray-900 p-4 rounded overflow-auto h-96 border border-green-900">
                        {JSON.stringify(data.rpc, null, 2)}
                    </pre>
                </section>

                <section>
                    <h2 className="text-blue-400 font-bold mb-2">Recent Executions (Raw)</h2>
                    <pre className="bg-gray-900 p-4 rounded overflow-auto h-96 border border-blue-900">
                        {JSON.stringify(data.executions, null, 2)}
                    </pre>
                </section>

                <section>
                    <h2 className="text-yellow-400 font-bold mb-2">Automations Config</h2>
                    <pre className="bg-gray-900 p-4 rounded overflow-auto h-96 border border-yellow-900">
                        {JSON.stringify(data.automations, null, 2)}
                    </pre>
                </section>
            </div>
        </div>
    );
}
