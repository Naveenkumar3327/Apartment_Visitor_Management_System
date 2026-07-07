"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { History, Search, Terminal, Calendar, Monitor, ShieldAlert } from "lucide-react";
import { getActivityLogsList } from "@/app/actions/audit";
import toast from "react-hot-toast";

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getActivityLogsList();
      setLogs(data);
    } catch (err) {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  if (!session || !["SUPER_ADMIN", "APARTMENT_ADMIN"].includes(session.user.role)) {
    return (
      <div className="p-6 text-center text-xs text-text-muted glass-panel rounded-2xl">
        Access restricted. Administrator privileges required.
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.user?.name.toLowerCase().includes(term) ||
      log.ipAddress?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">System Activity Logs</h2>
        <p className="text-xs text-text-secondary">Immutable audit trails of security actions, database entries, and authorization grants</p>
      </div>

      {/* Search filter */}
      <div className="p-4 rounded-2xl glass-panel-heavy">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by action, details, executing operator name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
          />
        </div>
      </div>

      {/* Logs Table panel */}
      <div className="p-6 rounded-2xl glass-panel-heavy overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-text-muted font-medium font-sans">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Operator</th>
                  <th className="pb-3">Action Type</th>
                  <th className="pb-3">Audit Details</th>
                  <th className="pb-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-secondary">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-3 text-[10px] text-text-muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 text-text-primary font-sans">
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs">{log.user.name}</span>
                          <span className="text-[9px] text-brand-indigo font-bold tracking-wider uppercase mt-0.5">{log.user.role.replace("_", " ")}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-text-muted">System Automaton</span>
                      )}
                    </td>
                    <td className="py-3 text-brand-indigo font-bold text-xs">{log.action}</td>
                    <td className="py-3 text-slate-300 font-sans text-xs max-w-sm break-words">{log.details}</td>
                    <td className="py-3 text-right text-[10px] text-text-muted">{log.ipAddress || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-text-muted">
            No audit records matching parameters found.
          </div>
        )}
      </div>

    </div>
  );
}
