"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, Plus, Trash2, Key, User, Phone, ShieldAlert, BadgeInfo } from "lucide-react";
import { getGuardsList, createGuard, removeGuard } from "@/app/actions/guard";
import toast from "react-hot-toast";

export default function GuardsManagerPage() {
  const { data: session } = useSession();
  
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Create Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [shift, setShift] = useState("DAY");
  const [gate, setGate] = useState("Gate 1 Main");
  const [idCard, setIdCard] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGuards();
  }, [activeTab]);

  const loadGuards = async () => {
    try {
      const data = await getGuardsList();
      setGuards(data);
    } catch (err) {
      toast.error("Failed to load security guards.");
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !idCard) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating guard session profile...");
    
    try {
      const res = await createGuard({
        name,
        email,
        passwordHash: password,
        phone,
        shift,
        assignedGate: gate,
        idCard,
      });

      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setIdCard("");
        setActiveTab("list");
      }
    } catch (err) {
      toast.error("Operation failed.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to remove guard ${name}? This deletes their login and gate records.`)) {
      return;
    }
    
    const toastId = toast.loading("Removing guard profile...");
    try {
      const res = await removeGuard(id);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        loadGuards();
      }
    } catch (err) {
      toast.error("Failed to remove guard.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Security Guards Registry</h2>
          <p className="text-xs text-text-secondary">Enrol checkpoints officers, assign gates, and schedule shift logs</p>
        </div>

        <div className="flex bg-white/5 border border-border p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "list" ? "bg-brand-indigo text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
          >
            Guards List
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${activeTab === "create" ? "bg-brand-indigo text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enrol Officer</span>
          </button>
        </div>
      </div>

      {/* Tab: LIST */}
      {activeTab === "list" && (
        <div className="p-6 rounded-2xl glass-panel-heavy overflow-hidden">
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
            </div>
          ) : guards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted font-medium">
                    <th className="pb-3">Officer</th>
                    <th className="pb-3">Badge ID</th>
                    <th className="pb-3">Shift Log</th>
                    <th className="pb-3">Checkpoint Gate</th>
                    <th className="pb-3">Performance</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-text-secondary">
                  {guards.map((guard) => (
                    <tr key={guard.id} className="hover:bg-white/5">
                      <td className="py-3.5 flex items-center space-x-3">
                        <img
                          src={guard.photoUrl || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop"}
                          alt={guard.user.name}
                          className="w-8 h-8 rounded-full object-cover border border-border/40 bg-slate-800"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">{guard.user.name}</span>
                          <span className="text-[10px] text-text-muted">{guard.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-text-primary">{guard.idCard || "N/A"}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold
                          ${guard.shift === "DAY" ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-brand-indigo"}
                        `}>
                          {guard.shift} SHIFT
                        </span>
                      </td>
                      <td className="py-3.5 text-text-primary font-medium">{guard.assignedGate}</td>
                      <td className="py-3.5">
                        <span className="text-brand-indigo font-bold">{guard.performance.toFixed(1)} / 5.0</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleRemove(guard.id, guard.user.name)}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete Guard"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-text-muted">
              No security guards enrolled. Use "Enrol Officer" tab to get started.
            </div>
          )}
        </div>
      )}

      {/* Tab: CREATE */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateSubmit} className="p-6 rounded-2xl glass-panel-heavy space-y-6 max-w-xl mx-auto">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Enrol New Security Guard</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Officer Rajesh Kumar"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Security Badge ID</label>
              <input
                type="text"
                required
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                placeholder="SG-2026-004"
                className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Email Address (Login ID)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@greenwood.com"
                className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 88888 77777"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Security Guard Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-sm text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
              >
                <option value="DAY">Day Shift (06:00 - 18:00)</option>
                <option value="NIGHT">Night Shift (18:00 - 06:00)</option>
                <option value="ROUTINE">Routine Shift (09:00 - 18:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Assigned Gate Point</label>
              <input
                type="text"
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                placeholder="Main Gate 1"
                className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Login Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 animate-pulse"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Create Guard Profile</span>
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}
