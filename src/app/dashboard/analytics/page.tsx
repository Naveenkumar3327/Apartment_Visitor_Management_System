"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LineChart, BarChart, AreaChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, PieChart, Pie, Cell } from "recharts";
import { getDashboardData } from "@/app/actions/dashboard";
import { LineChart as ChartIcon, PieChart as PieIcon, BarChart2, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const dbData = await getDashboardData();
      setData(dbData);
    } catch (err) {
      toast.error("Failed to load society analytics.");
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

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Advanced Analytics Desk</h2>
        <p className="text-xs text-text-secondary">Track visitor flows, peak security checkpoint times, and flat traffic loads</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 glass-panel rounded-2xl animate-pulse" />
          <div className="h-64 glass-panel rounded-2xl animate-pulse" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Header metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <span className="text-xs text-text-secondary font-medium">Busiest Hour</span>
              <span className="text-2xl font-bold font-heading text-text-primary">05:00 PM - 07:00 PM</span>
              <Calendar className="absolute right-4 bottom-4 w-10 h-10 text-indigo-500/10" />
            </div>

            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <span className="text-xs text-text-secondary font-medium">Top Entry Purpose</span>
              <span className="text-2xl font-bold font-heading text-brand-indigo">Courier & Delivery</span>
              <PieIcon className="absolute right-4 bottom-4 w-10 h-10 text-brand-indigo/10" />
            </div>

            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <span className="text-xs text-text-secondary font-medium">Monthly Active Visitors</span>
              <span className="text-2xl font-bold font-heading text-brand-emerald">1,248 entries</span>
              <TrendingUp className="absolute right-4 bottom-4 w-10 h-10 text-brand-emerald/10" />
            </div>
          </div>

          {/* Graphical charts grids */}
          {mounted && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Traffic flow area chart */}
              <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
                <div className="flex items-center space-x-2">
                  <ChartIcon className="w-5 h-5 text-brand-indigo" />
                  <h3 className="font-heading font-semibold text-sm text-text-primary">Weekly Check-in Distribution</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.visitorTrend}>
                      <defs>
                        <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} />
                      <Tooltip contentStyle={{ background: "var(--bg-surface-solid)", borderColor: "var(--border-glass)" }} />
                      <Area type="monotone" dataKey="visitors" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVis)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Purpose Pie Chart */}
              <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
                <div className="flex items-center space-x-2">
                  <PieIcon className="w-5 h-5 text-brand-purple" />
                  <h3 className="font-heading font-semibold text-sm text-text-primary">Purpose Ratios</h3>
                </div>
                <div className="h-64 w-full flex items-center justify-center">
                  {data.purposeChartData?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.purposeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
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
                    <span className="text-xs text-text-muted">No details logs captured yet.</span>
                  )}
                </div>
              </div>

              {/* Bar Chart: Busiest Flats */}
              <div className="p-6 rounded-2xl glass-panel-heavy space-y-4 lg:col-span-2">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-brand-emerald" />
                  <h3 className="font-heading font-semibold text-sm text-text-primary">Top 5 Visited Flats (Entries Volume)</h3>
                </div>
                <div className="h-64 w-full">
                  {data.topFlatsData?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.topFlatsData}>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} />
                        <Tooltip contentStyle={{ background: "var(--bg-surface-solid)", borderColor: "var(--border-glass)" }} />
                        <Bar dataKey="value" fill="#34d399" radius={[5, 5, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="py-20 text-center text-xs text-text-muted flex items-center justify-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Seeded visits log is not mapped or empty. Check seed script databases.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-muted">
          Failed to compile analytical layouts.
        </div>
      )}

    </div>
  );
}
