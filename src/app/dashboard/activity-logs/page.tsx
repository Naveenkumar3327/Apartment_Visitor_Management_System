"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  History, Search, Terminal, Calendar, Monitor, 
  ShieldAlert, Download, RefreshCw, Trash2, Database,
  ArrowLeft, ArrowRight, Eye, Smartphone, Tablet, Laptop,
  CheckCircle, XCircle, MapPin
} from "lucide-react";
import { 
  getActivityLogsList, 
  archiveActivityLogs, 
  triggerManualBackup 
} from "@/app/actions/audit";
import toast from "react-hot-toast";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line 
} from "recharts";

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [deviceType, setDeviceType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [location, setLocation] = useState("");
  
  // Archiving
  const [archiveDays, setArchiveDays] = useState(90);
  const [submittingArchive, setSubmittingArchive] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // Modal / Detailed View
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    loadLogs(1);
  }, [role, deviceType, status, dateStart, dateEnd]);

  // Handle Search Input Debouncing / Trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (mounted) loadLogs(1);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, location]);

  const loadLogs = async (page: number) => {
    setLoading(true);
    try {
      const data = await getActivityLogsList({
        page,
        limit: 15,
        search,
        role,
        deviceType,
        status,
        dateStart,
        dateEnd,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
      setCurrentPage(data.currentPage);
    } catch (err) {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const result = await triggerManualBackup();
      toast.success(result.message || "Manual encrypted backup completed.");
    } catch (error: any) {
      toast.error(error.message || "Backup failed.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete audit records older than ${archiveDays} days?`)) {
      return;
    }
    setSubmittingArchive(true);
    try {
      const result = await archiveActivityLogs(archiveDays);
      toast.success(result.message || "Logs archived successfully.");
      loadLogs(1);
    } catch (error: any) {
      toast.error(error.message || "Archiving logs failed.");
    } finally {
      setSubmittingArchive(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error("No log entries to export.");
      return;
    }
    // Generate headers
    const headers = [
      "Log ID", "Timestamp", "Operator Name", "Operator Role", "Operator Email",
      "Action", "Module", "API Endpoint", "Request Method", "Response Status",
      "Status", "Failure Reason", "IP Address", "Location", "Device Name", "Device Type", "OS", "Browser"
    ];

    const rows = logs.map(log => [
      log.id || "",
      new Date(log.createdAt).toISOString(),
      log.fullName || "System",
      log.role || "SYSTEM",
      log.email || "",
      log.action || "",
      log.moduleName || "",
      log.apiEndpoint || "",
      log.requestMethod || "",
      log.responseStatus || "",
      log.status || "",
      log.failureReason || "",
      log.ipAddress || "",
      log.location || "",
      log.deviceName || "",
      log.deviceType || "",
      log.operatingSystem || "",
      `${log.browserName || ""} ${log.browserVersion || ""}`
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  // Helper to render Device Icon
  const renderDeviceIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "MOBILE":
        return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case "TABLET":
        return <Tablet className="w-4 h-4 text-purple-500" />;
      default:
        return <Laptop className="w-4 h-4 text-indigo-500" />;
    }
  };

  // Parse chart data (logs count by status)
  const getChartData = () => {
    const dataMap: Record<string, { name: string; Success: number; Failure: number }> = {};
    
    // Group logs of current page by simplified time or action name
    logs.slice(0, 10).reverse().forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { name: dateStr, Success: 0, Failure: 0 };
      }
      if (log.status === "SUCCESS") {
        dataMap[dateStr].Success += 1;
      } else {
        dataMap[dateStr].Failure += 1;
      }
    });

    return Object.values(dataMap);
  };

  if (!session || !["SUPER_ADMIN", "APARTMENT_ADMIN"].includes(session.user.role)) {
    return (
      <div className="p-6 text-center text-xs text-text-muted glass-panel rounded-2xl">
        Access restricted. Administrator privileges required.
      </div>
    );
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary flex items-center gap-2">
            <History className="w-6 h-6 text-brand-indigo" />
            Enterprise Audit Logs
          </h2>
          <p className="text-xs text-text-secondary">
            Immutable, cryptographically secured trails of security operations, auth lifecycle, and data audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadLogs(currentPage)}
            className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 glass-panel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo hover:bg-brand-indigo/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      {mounted && logs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Card */}
          <div className="lg:col-span-2 p-5 rounded-2xl glass-panel-heavy space-y-4">
            <h3 className="text-xs font-semibold text-text-primary tracking-wider uppercase">
              Recent Event Operations Timeline
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "rgba(15, 15, 25, 0.95)", 
                      border: "1px solid var(--border-glass)", 
                      borderRadius: "12px",
                      fontSize: "10px"
                    }} 
                  />
                  <Line type="monotone" dataKey="Success" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Failure" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Control Admin Box */}
          <div className="p-5 rounded-2xl glass-panel-heavy flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-text-primary tracking-wider uppercase flex items-center gap-1.5">
                <Database className="w-4 h-4 text-brand-indigo" />
                Security Controls
              </h3>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Super Admins can trigger encrypted database snapshots or clean/archive historical trails to free resources.
              </p>
            </div>

            <div className="space-y-3">
              {isSuperAdmin ? (
                <>
                  <button
                    onClick={handleBackup}
                    disabled={backingUp}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 hover:opacity-90 disabled:opacity-50"
                  >
                    {backingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Generate Encrypted Backup
                  </button>

                  <form onSubmit={handleArchive} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        value={archiveDays}
                        onChange={(e) => setArchiveDays(parseInt(e.target.value) || 30)}
                        className="w-full h-9 pl-3 pr-14 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-semibold">
                        days
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingArchive}
                      className="py-2 px-3.5 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  </form>
                </>
              ) : (
                <div className="p-3 bg-white/5 rounded-xl border border-border text-[10px] text-center text-text-muted">
                  Manual database backups and logs archiving are restricted to Super Administrators.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="p-5 rounded-2xl glass-panel-heavy space-y-4">
        <h3 className="text-xs font-semibold text-text-primary tracking-wider uppercase">
          Advanced Audit Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search details, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Filter by Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            />
          </div>

          <div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="APARTMENT_ADMIN">Apartment Admin</option>
              <option value="SECURITY_GUARD">Security Guard</option>
              <option value="RESIDENT">Resident</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          <div>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            >
              <option value="ALL">All Devices</option>
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
              <option value="TABLET">Tablet</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 border-t border-border/20">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-secondary whitespace-nowrap">From:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-secondary whitespace-nowrap">To:</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="p-6 rounded-2xl glass-panel-heavy overflow-hidden space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-border text-text-muted font-medium">
                    <th className="pb-3 pl-2">Timestamp</th>
                    <th className="pb-3">Operator</th>
                    <th className="pb-3">Action Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Device / OS</th>
                    <th className="pb-3 text-right pr-2">IP / Location</th>
                    <th className="pb-3 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-text-secondary font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 text-[10px] text-text-muted pl-2 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary text-xs">{log.fullName || "System"}</span>
                          <span className="text-[9px] text-brand-indigo font-bold tracking-wider uppercase mt-0.5 font-mono">
                            {log.role?.replace("_", " ") || "SYSTEM"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="text-brand-indigo font-bold text-xs font-mono">{log.action}</span>
                          <span className="text-[10px] text-text-secondary truncate max-w-[240px] font-mono mt-0.5">{log.details || log.apiEndpoint}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Failure
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          {renderDeviceIcon(log.deviceType)}
                          <div className="flex flex-col text-[10px]">
                            <span className="text-text-primary">{log.operatingSystem || "Unknown"}</span>
                            <span className="text-text-muted">{log.browserName || "Unknown"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="flex flex-col text-[10px] font-mono">
                          <span className="text-text-primary">{log.ipAddress}</span>
                          <span className="text-text-muted max-w-[140px] truncate">{log.location || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-white/5 border border-border/40 hover:bg-brand-indigo/10 hover:border-brand-indigo/20 text-brand-indigo transition-all duration-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/25">
                <span className="text-[11px] text-text-secondary">
                  Showing page <strong className="text-text-primary">{currentPage}</strong> of <strong className="text-text-primary">{pages}</strong> ({total} entries)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => loadLogs(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-border bg-white/5 text-text-muted hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => loadLogs(currentPage + 1)}
                    disabled={currentPage === pages}
                    className="p-2 rounded-xl border border-border bg-white/5 text-text-muted hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition-all duration-200"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-xs text-text-muted">
            No audit records matching parameters found.
          </div>
        )}
      </div>

      {/* Audit Logs Details Side Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl h-full max-h-[85vh] rounded-2xl glass-panel-heavy p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Inspect Audit Record</h3>
                  <span className="text-[10px] text-text-muted font-mono">{selectedLog.id}</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="py-1.5 px-3 rounded-lg border border-border hover:bg-white/10 text-xs text-text-primary transition-all duration-200 font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">Operator</span>
                  <p className="text-text-primary font-bold">{selectedLog.fullName || "System"}</p>
                  <p className="text-[10px] text-text-secondary">{selectedLog.email || "No Email Address"}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">Role</span>
                  <p className="text-brand-indigo font-extrabold uppercase font-mono">{selectedLog.role || "SYSTEM"}</p>
                  <p className="text-[9px] text-text-muted font-mono">Auth: {selectedLog.authMethod || "N/A"}</p>
                </div>
                
                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1 col-span-2">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">Action Performed</span>
                  <p className="text-text-primary font-bold font-mono text-sm">{selectedLog.action}</p>
                  <p className="text-[11px] text-slate-300 italic">{selectedLog.details || "No explicit comments"}</p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">IP Address</span>
                  <p className="text-text-primary font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">Approx Location</span>
                  <p className="text-text-primary font-mono truncate">{selectedLog.location || "Unknown Location"}</p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1 col-span-2">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">Session Parameters</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-secondary">
                    <div>Session ID: <span className="text-text-primary">{selectedLog.sessionId || "N/A"}</span></div>
                    <div>Duration: <span className="text-text-primary">{selectedLog.sessionDuration}s</span></div>
                    <div>API Route: <span className="text-text-primary">{selectedLog.requestMethod} {selectedLog.apiEndpoint}</span></div>
                    <div>HTTP Code: <span className="text-text-primary">{selectedLog.responseStatus}</span></div>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-border/40 space-y-1 col-span-2">
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-semibold">Client Agent Payload</span>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-text-secondary">
                    <div>Device: <span className="text-text-primary">{selectedLog.deviceName}</span></div>
                    <div>OS: <span className="text-text-primary">{selectedLog.operatingSystem}</span></div>
                    <div>Browser: <span className="text-text-primary">{selectedLog.browserName} v{selectedLog.browserVersion}</span></div>
                  </div>
                </div>

                {selectedLog.failureReason && (
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 space-y-1 col-span-2">
                    <span className="text-[10px] text-red-500 font-bold tracking-wider uppercase font-semibold">Audit Failure Reason</span>
                    <p className="text-red-500 font-semibold font-mono text-xs">{selectedLog.failureReason}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-border/40 pt-4 flex items-center justify-between text-[10px] text-text-muted">
              <span>Timestamp: {new Date(selectedLog.createdAt).toUTCString()}</span>
              <span>Module: {selectedLog.moduleName || "Audit"}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
