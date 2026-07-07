"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  UserCheck,
  QrCode,
  Scan,
  Send,
  Building,
  LogOut,
  MapPin,
  Flame,
  Plus
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from "recharts";
import toast from "react-hot-toast";
import { resolveApproval } from "@/app/actions/approval";
import { checkOutVisitor } from "@/app/actions/visitor";

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function DashboardClient({ initialData }: { initialData: any }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [mounted, setMounted] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!session) return null;

  const role = session.user.role;

  // Handle Resident Approvals from Dashboard
  const handleApproval = async (approvalId: string, status: "APPROVED" | "REJECTED") => {
    setResolvingId(approvalId);
    const toastId = toast.loading(`Submitting ${status.toLowerCase()} response...`);
    try {
      const result = await resolveApproval(approvalId, status);
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(result.message, { id: toastId });
        // Refresh local data state
        setData((prev: any) => ({
          ...prev,
          stats: {
            ...prev.stats,
            pending: Math.max(0, prev.stats.pending - 1),
            todayVisitors: status === "APPROVED" ? prev.stats.todayVisitors + 1 : prev.stats.todayVisitors,
            inside: status === "APPROVED" ? prev.stats.inside + 1 : prev.stats.inside,
          },
          preBookedPasses: prev.preBookedPasses,
          visitorLogs: prev.visitorLogs.map((log: any) => {
            if (log.approval?.id === approvalId) {
              return { 
                ...log, 
                status: status === "APPROVED" ? "INSIDE" : "REJECTED",
                actualArrival: status === "APPROVED" ? new Date() : null
              };
            }
            return log;
          })
        }));
      }
    } catch (error) {
      toast.error("Failed to process approval.", { id: toastId });
    } finally {
      setResolvingId(null);
    }
  };

  // Handle Guard checkout from Dashboard
  const handleCheckout = async (logId: string) => {
    const toastId = toast.loading("Processing check-out...");
    try {
      const result = await checkOutVisitor(logId);
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(result.message, { id: toastId });
        // Refresh state
        setData((prev: any) => ({
          ...prev,
          stats: {
            ...prev.stats,
            inside: Math.max(0, prev.stats.inside - 1),
            todayCheckouts: prev.stats.todayCheckouts + 1,
          },
          todayLogs: prev.todayLogs.map((log: any) => {
            if (log.id === logId) {
              return { ...log, status: "EXITED", actualExit: new Date() };
            }
            return log;
          })
        }));
      }
    } catch (error) {
      toast.error("Connection failed.", { id: toastId });
    }
  };

  // 1. ADMIN DASHBOARD VIEW
  if (role === "SUPER_ADMIN" || role === "APARTMENT_ADMIN") {
    return (
      <div className="space-y-6">
        {/* Page title */}
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Society Administration Overview</h2>
          <p className="text-xs text-text-secondary">Security checkpoints, resident databases, and audit trails</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-32">
            <span className="text-xs text-text-secondary font-medium">Today's Visitors</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold font-heading text-text-primary">{data.stats?.todayVisitors || 0}</span>
              <span className="text-[10px] text-brand-emerald font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
              </span>
            </div>
            <Users className="absolute right-4 bottom-4 w-12 h-12 text-indigo-500/10" />
          </div>

          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-32">
            <span className="text-xs text-text-secondary font-medium">Currently Inside</span>
            <span className="text-3xl font-extrabold font-heading text-brand-indigo">{data.stats?.inside || 0}</span>
            <Clock className="absolute right-4 bottom-4 w-12 h-12 text-brand-indigo/10" />
          </div>

          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-32">
            <span className="text-xs text-text-secondary font-medium">Pending Approvals</span>
            <span className="text-3xl font-extrabold font-heading text-amber-500">{data.stats?.pending || 0}</span>
            <ShieldAlert className="absolute right-4 bottom-4 w-12 h-12 text-amber-500/10" />
          </div>

          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-32">
            <span className="text-xs text-text-secondary font-medium">Total Flats & Residents</span>
            <span className="text-3xl font-extrabold font-heading text-brand-emerald">{data.stats?.residents || 0}</span>
            <Building className="absolute right-4 bottom-4 w-12 h-12 text-brand-emerald/10" />
          </div>
        </div>

        {/* Charts & Graphs */}
        {mounted && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly trend Area chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-4">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Weekly Visitor Traffic Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.visitorTrend}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "var(--bg-surface-solid)", borderColor: "var(--border-glass)" }} />
                    <Area type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Purpose Pie chart */}
            <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Visitors by Purpose</h3>
              <div className="h-64 w-full flex items-center justify-center">
                {data.purposeChartData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.purposeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.purposeChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--bg-surface-solid)", borderColor: "var(--border-glass)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-text-muted">No records available</span>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Data Grid: Recent Visitor Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Recent Gate Log Entries</h3>
              <Link href="/dashboard/visitors" className="text-xs text-brand-indigo hover:underline">View register</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted font-medium">
                    <th className="pb-3">Visitor</th>
                    <th className="pb-3">Destination</th>
                    <th className="pb-3">Purpose</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.recentLogs?.map((log: any) => (
                    <tr key={log.id} className="text-text-secondary hover:bg-white/5">
                      <td className="py-3.5 font-medium text-text-primary">{log.visitor.name}</td>
                      <td className="py-3.5">Flat {log.flat.block.name}-{log.flat.number}</td>
                      <td className="py-3.5"><span className="px-2 py-0.5 rounded bg-white/5">{log.purpose}</span></td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase
                          ${log.status === "INSIDE" ? "bg-indigo-500/10 text-brand-indigo" : ""}
                          ${log.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : ""}
                          ${log.status === "REJECTED" ? "bg-red-500/10 text-red-500" : ""}
                          ${log.status === "EXITED" ? "bg-emerald-500/10 text-brand-emerald" : ""}
                        `}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Logs Audit trail */}
          <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
            <h3 className="font-heading font-semibold text-sm text-text-primary">System Audit Trail</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {data.recentActivities?.map((act: any) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-indigo" />
                  <div>
                    <p className="text-text-primary font-medium">{act.action}</p>
                    <p className="text-text-muted text-[10px]">{act.details}</p>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // 2. RESIDENT DASHBOARD VIEW
  if (role === "RESIDENT") {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-text-primary">Greenwood Resident Control</h2>
            <p className="text-xs text-text-secondary">Resident Profile: {data.flatInfo || "Retrieving flat..."}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link 
              href="/dashboard/qr" 
              className="px-4 py-2 rounded-xl bg-brand-indigo text-white font-medium text-xs shadow-md shadow-indigo-500/20 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invite</span>
            </Link>
          </div>
        </div>

        {/* Resident Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">My Visitors Today</span>
            <span className="text-3xl font-extrabold font-heading text-text-primary">{data.stats?.todayVisitors || 0}</span>
          </div>
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">Currently Inside</span>
            <span className="text-3xl font-extrabold font-heading text-brand-indigo">{data.stats?.inside || 0}</span>
          </div>
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">Pending Requests</span>
            <span className="text-3xl font-extrabold font-heading text-amber-500">{data.stats?.pending || 0}</span>
          </div>
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">Total History Logs</span>
            <span className="text-3xl font-extrabold font-heading text-brand-emerald">{data.stats?.totalHistory || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Approvals Panel */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-4">
            <h3 className="font-heading font-semibold text-sm text-text-primary">Gate Approval Desk</h3>
            
            {data.visitorLogs?.filter((log: any) => log.status === "PENDING").length > 0 ? (
              <div className="space-y-4">
                {data.visitorLogs?.filter((log: any) => log.status === "PENDING").map((log: any) => (
                  <div key={log.id} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase font-semibold">
                        Awaiting Response
                      </span>
                      <h4 className="font-heading font-bold text-white mt-1.5">{log.visitor.name}</h4>
                      <p className="text-xs text-slate-400">Purpose: {log.purpose} | Gate 1</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproval(log.approval?.id || "", "REJECTED")}
                        disabled={resolvingId !== null}
                        className="px-3.5 py-1.5 rounded-xl border border-red-500/20 text-red-500 text-xs font-semibold hover:bg-red-500/10 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproval(log.approval?.id || "", "APPROVED")}
                        disabled={resolvingId !== null}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
                      >
                        Approve entry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="w-8 h-8 text-brand-emerald" />
                <span>No pending gate requests for your Flat at this moment.</span>
              </div>
            )}
          </div>

          {/* Pre-booked Passes panel */}
          <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Active Invites</h3>
              <Link href="/dashboard/qr" className="text-xs text-brand-indigo hover:underline">View all</Link>
            </div>
            
            {data.preBookedPasses?.length > 0 ? (
              <div className="space-y-3">
                {data.preBookedPasses.map((pass: any) => (
                  <div key={pass.id} className="p-3.5 rounded-xl border border-border bg-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-xs text-text-primary">{pass.visitorName}</h4>
                      <span className="text-[10px] text-text-muted">Code: {pass.code}</span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">
                      Exp: {new Date(pass.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                <span>No active pre-booked visitors invitations.</span>
              </div>
            )}
          </div>

        </div>

        {/* Resident's Visitor Log history */}
        <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Flat Visitors History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Purpose</th>
                  <th className="pb-3">Arrival Time</th>
                  <th className="pb-3">Exit Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-secondary">
                {data.visitorLogs?.slice(0, 4).map((log: any) => (
                  <tr key={log.id}>
                    <td className="py-3 font-medium text-text-primary">{log.visitor.name}</td>
                    <td className="py-3">{log.purpose}</td>
                    <td className="py-3">{log.actualArrival ? new Date(log.actualArrival).toLocaleString() : "Pending"}</td>
                    <td className="py-3">{log.actualExit ? new Date(log.actualExit).toLocaleString() : "Inside"}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase
                        ${log.status === "INSIDE" ? "bg-indigo-500/10 text-brand-indigo animate-pulse" : ""}
                        ${log.status === "EXITED" ? "bg-emerald-500/10 text-brand-emerald" : ""}
                        ${log.status === "REJECTED" ? "bg-red-500/10 text-red-500" : ""}
                        ${log.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : ""}
                      `}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // 3. SECURITY GUARD DASHBOARD VIEW
  if (role === "SECURITY_GUARD") {
    return (
      <div className="space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-2xl text-text-primary">Gate Checkpoint Dashboard</h2>
            <p className="text-xs text-text-secondary">
              Station Location: {data.guardInfo?.gate || "Main Checkpoint"} | Shift: {data.guardInfo?.shift || "Day"}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link 
              href="/dashboard/visitors" 
              className="px-4 py-2 rounded-xl bg-white/5 border border-border text-text-primary font-medium text-xs hover:bg-white/10 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </Link>
            <Link 
              href="/dashboard/scanner" 
              className="px-4 py-2 rounded-xl bg-brand-indigo text-white font-medium text-xs hover:bg-indigo-500 shadow-md shadow-indigo-500/20 flex items-center space-x-1.5"
            >
              <Scan className="w-4 h-4 animate-bounce" />
              <span>Scan QR Pass</span>
            </Link>
          </div>
        </div>

        {/* Guard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">Checked In (Today)</span>
            <span className="text-3xl font-extrabold font-heading text-text-primary">{data.stats?.todayCheckins || 0}</span>
          </div>
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">Checked Out (Today)</span>
            <span className="text-3xl font-extrabold font-heading text-brand-emerald">{data.stats?.todayCheckouts || 0}</span>
          </div>
          <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-28">
            <span className="text-xs text-text-secondary font-medium">Currently Inside Complexes</span>
            <span className="text-3xl font-extrabold font-heading text-brand-indigo">{data.stats?.inside || 0}</span>
          </div>
        </div>

        {/* Guard checkpoint registry panel */}
        <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Today's Checkpoint Entries</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Flat Dest.</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Arrived At</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-secondary">
                {data.todayLogs?.length > 0 ? (
                  data.todayLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-3 font-semibold text-text-primary">{log.visitor.name}</td>
                      <td className="py-3">{log.visitor.phone}</td>
                      <td className="py-3">Flat {log.flat.block.name}-{log.flat.number}</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-white/5">{log.visitorType}</span></td>
                      <td className="py-3">
                        {log.actualArrival ? new Date(log.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Awaiting Resident"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase
                          ${log.status === "INSIDE" ? "bg-indigo-500/10 text-brand-indigo" : ""}
                          ${log.status === "EXITED" ? "bg-emerald-500/10 text-brand-emerald" : ""}
                          ${log.status === "PENDING" ? "bg-amber-500/10 text-amber-500 animate-pulse" : ""}
                          ${log.status === "REJECTED" ? "bg-red-500/10 text-red-500" : ""}
                        `}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {log.status === "INSIDE" ? (
                          <button
                            onClick={() => handleCheckout(log.id)}
                            className="px-2.5 py-1 rounded bg-brand-emerald hover:bg-emerald-500 text-white font-medium text-[10px]"
                          >
                            Check-Out
                          </button>
                        ) : log.status === "PENDING" ? (
                          <span className="text-[10px] text-amber-500 font-medium animate-pulse">Awaiting Approval</span>
                        ) : (
                          <span className="text-[10px] text-text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No visitors checked in today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  return null;
}
