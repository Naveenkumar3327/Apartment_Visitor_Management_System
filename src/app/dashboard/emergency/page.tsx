"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "use-session"; // Wait, standard is `useSession` from `next-auth/react`
import { useSession as useAuthSession } from "next-auth/react";
import { ShieldAlert, Flame, Activity, ShieldCheck, HeartPulse, Send, AlertTriangle, AlertCircle } from "lucide-react";
import { triggerEmergencyAlert, getActiveEmergencies, resolveEmergencyAlert } from "@/app/actions/emergency";
import toast from "react-hot-toast";

export default function EmergencyControlPage() {
  const { data: session } = useAuthSession();
  
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [triggering, setTriggering] = useState(false);
  const [notes, setNotes] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmergencies();
  }, []);

  const loadEmergencies = async () => {
    try {
      const data = await getActiveEmergencies();
      if (Array.isArray(data)) {
        setActiveAlerts(data);
      }
    } catch (err) {
      toast.error("Failed to load active emergencies list.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  const handlePanicTrigger = async (type: "FIRE" | "MEDICAL" | "POLICE" | "PANIC") => {
    if (!confirm(`Warning: You are triggering a high-priority ${type} Emergency Alarm. Security staff and managers will be alerted instantly. Do you want to proceed?`)) {
      return;
    }

    setTriggering(true);
    const toastId = toast.loading(`Broadcasting emergency ${type} panic alarm...`);
    
    try {
      const res = await triggerEmergencyAlert(type, notes || `Manual Emergency alert of type ${type}`);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        setNotes("");
        loadEmergencies();
      }
    } catch (err) {
      toast.error("Network dispatch failure.", { id: toastId });
    } finally {
      setTriggering(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    const resNotes = resolutionNotes[alertId] || "Resolved by checkpoint staff.";
    const toastId = toast.loading("Marking alert as resolved...");
    
    try {
      const res = await resolveEmergencyAlert(alertId, resNotes);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success("Emergency resolved and logged.", { id: toastId });
        loadEmergencies();
      }
    } catch (err) {
      toast.error("Action failed.", { id: toastId });
    } finally {
      setResolvingId(null);
    }
  };

  const handleResNotesChange = (id: string, text: string) => {
    setResolutionNotes(prev => ({ ...prev, [id]: text }));
  };

  const canResolve = ["SUPER_ADMIN", "APARTMENT_ADMIN", "SECURITY_GUARD"].includes(session.user.role);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Emergency Crisis & Panic Center</h2>
        <p className="text-xs text-text-secondary">Broadcast urgent crisis warnings or audit active society panic alarms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Panic Button section */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-6">
          <div className="flex items-center space-x-2 text-red-500 font-bold uppercase tracking-wider text-xs">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span>Crisis Broadcast Terminal</span>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            Choose your crisis alert category. Triggering any category below instantly registers the alert and dispatches mock emails and SMS notifications to all guard checkpoints and managers.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handlePanicTrigger("FIRE")}
              disabled={triggering}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-heading font-semibold text-xs transition-colors space-y-2 h-28 focus:outline-none"
            >
              <Flame className="w-8 h-8 animate-pulse" />
              <span>Fire Alert</span>
            </button>

            <button
              onClick={() => handlePanicTrigger("MEDICAL")}
              disabled={triggering}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-heading font-semibold text-xs transition-colors space-y-2 h-28 focus:outline-none"
            >
              <HeartPulse className="w-8 h-8 animate-pulse" />
              <span>Medical Emergency</span>
            </button>

            <button
              onClick={() => handlePanicTrigger("POLICE")}
              disabled={triggering}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-heading font-semibold text-xs transition-colors space-y-2 h-28 focus:outline-none"
            >
              <ShieldAlert className="w-8 h-8 animate-pulse" />
              <span>Police / Security</span>
            </button>

            <button
              onClick={() => handlePanicTrigger("PANIC")}
              disabled={triggering}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-heading font-semibold text-xs transition-colors space-y-2 h-28 focus:outline-none"
            >
              <AlertCircle className="w-8 h-8 animate-pulse" />
              <span>General Panic</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Emergency Incident Details (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Smoke coming from block A elevators lobby"
              className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-indigo"
            />
          </div>
        </div>

        {/* Active emergencies list */}
        <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Active Society Alerts</h3>

          {loading ? (
            <div className="h-28 w-full bg-white/5 rounded-xl animate-pulse" />
          ) : activeAlerts.length > 0 ? (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs space-y-4 relative overflow-hidden animate-pulse">
                  
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-red-500 text-[10px] font-bold text-white uppercase tracking-wider mb-1">
                      {alert.type} CRITICAL
                    </span>
                    <p className="text-white font-bold text-xs mt-1">Triggered by: {alert.triggeredBy.name}</p>
                    <p className="text-slate-300 mt-1">Notes: {alert.notes}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      Time: {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {canResolve && (
                    <div className="space-y-2 pt-2 border-t border-red-500/15">
                      <input
                        type="text"
                        placeholder="Resolution description..."
                        value={resolutionNotes[alert.id] || ""}
                        onChange={(e) => handleResNotesChange(alert.id, e.target.value)}
                        className="w-full h-8 px-2 rounded bg-slate-950/60 border border-white/10 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={resolvingId !== null}
                        className="w-full h-8 rounded bg-brand-emerald hover:bg-emerald-500 text-white font-semibold text-[10px] transition-colors flex items-center justify-center space-x-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center justify-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-brand-emerald/20" />
              <span>All systems clear. No active panic alerts.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
