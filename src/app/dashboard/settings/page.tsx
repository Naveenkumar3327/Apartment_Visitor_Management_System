"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, Clock, Bell, Monitor, Lock, ShieldAlert } from "lucide-react";
import { getSystemSettings, updateSystemSettings } from "@/app/actions/settings";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [workingHours, setWorkingHours] = useState("");
  const [visitorLimit, setVisitorLimit] = useState(120);
  const [qrExpiry, setQrExpiry] = useState(1440);
  const [notifConfig, setNotifConfig] = useState("EMAIL_SMS");
  const [appTheme, setAppTheme] = useState("LIGHT");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const dbSettings = await getSystemSettings();
      if (dbSettings) {
        setSettings(dbSettings);
        setWorkingHours(dbSettings.workingHours);
        setVisitorLimit(dbSettings.visitorTimeLimit);
        setQrExpiry(dbSettings.qrExpiry);
        setNotifConfig(dbSettings.notificationSettings);
        setAppTheme(dbSettings.theme);
      }
    } catch (err) {
      toast.error("Failed to retrieve system settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;
  const isAdmin = ["SUPER_ADMIN", "APARTMENT_ADMIN"].includes(session.user.role);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Security alert: Admin access required.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving configuration updates...");
    try {
      const res = await updateSystemSettings({
        workingHours,
        visitorTimeLimit: Number(visitorLimit),
        qrExpiry: Number(qrExpiry),
        notificationSettings: notifConfig,
        theme: appTheme,
      });

      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        loadSettings();
      }
    } catch (err) {
      toast.error("Failed to commit settings.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">System Preferences</h2>
        <p className="text-xs text-text-secondary">Configure gate rules, visitor time thresholds, and default notifications</p>
      </div>

      {loading ? (
        <div className="h-64 w-full glass-panel rounded-2xl animate-pulse" />
      ) : settings ? (
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSave} className="p-6 rounded-2xl glass-panel-heavy space-y-6">
            <div className="flex items-center space-x-2 border-b border-border/50 pb-4">
              <Settings className="w-5 h-5 text-brand-indigo" />
              <h3 className="font-heading font-bold text-sm text-text-primary">Gate Control Rules</h3>
            </div>

            <div className="space-y-5">
              
              {/* Working Hours */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-brand-indigo" />
                  <span>Checkpoint Operating Hours</span>
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  required
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="06:00 - 22:00"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Visitor time limit */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">
                  Visitor Time limit Threshold ({visitorLimit} minutes)
                </label>
                <input
                  type="range"
                  min={30}
                  max={360}
                  step={30}
                  disabled={!isAdmin}
                  value={visitorLimit}
                  onChange={(e) => setVisitorLimit(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 border border-border rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
                />
                <span className="text-[10px] text-text-muted mt-1 block">
                  Alert is logged if visitors stay inside the complex longer than this threshold.
                </span>
              </div>

              {/* QR Code Expiry */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">
                  Invitation QR Code Expiry Limit ({qrExpiry / 60} hours)
                </label>
                <select
                  disabled={!isAdmin}
                  value={qrExpiry}
                  onChange={(e) => setQrExpiry(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-sm focus:outline-none disabled:opacity-50 appearance-none"
                >
                  <option value={240}>4 Hours</option>
                  <option value={720}>12 Hours</option>
                  <option value={1440}>24 Hours</option>
                  <option value={2880}>48 Hours</option>
                </select>
              </div>

              {/* Notifications */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase flex items-center space-x-1.5">
                  <Bell className="w-4 h-4 text-brand-emerald" />
                  <span>Resident Dispatch Channels</span>
                </label>
                <select
                  disabled={!isAdmin}
                  value={notifConfig}
                  onChange={(e) => setNotifConfig(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-sm focus:outline-none disabled:opacity-50 appearance-none"
                >
                  <option value="EMAIL_PUSH">In-App Push & Email</option>
                  <option value="EMAIL_SMS">Email & SMS Alerts</option>
                  <option value="ALL">Email, SMS, and WhatsApp</option>
                </select>
              </div>

              {/* Base Theme */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase flex items-center space-x-1.5">
                  <Monitor className="w-4 h-4 text-brand-purple" />
                  <span>Preferred Default UI Theme</span>
                </label>
                <select
                  disabled={!isAdmin}
                  value={appTheme}
                  onChange={(e) => setAppTheme(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-sm focus:outline-none disabled:opacity-50 appearance-none"
                >
                  <option value="LIGHT">Premium Light Theme</option>
                  <option value="DARK">Deep Space Dark Mode</option>
                </select>
              </div>

            </div>

            {isAdmin ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-brand-indigo hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Gate Configurations</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 bg-white/5 rounded-xl border border-border flex items-center space-x-2 text-[10px] text-text-muted">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Preferences locked. Administrator authorization is required to edit.</span>
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-muted">
          Settings module failed to load.
        </div>
      )}

    </div>
  );
}
