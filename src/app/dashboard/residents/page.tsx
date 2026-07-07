"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Search, Ban, UserCheck, Trash2, Home, Mail, Phone, ShieldCheck } from "lucide-react";
import { getResidentsList, toggleResidentStatus, removeResident } from "@/app/actions/resident";
import toast from "react-hot-toast";

export default function ResidentsRosterPage() {
  const { data: session } = useSession();
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    try {
      const data = await getResidentsList();
      setResidents(data);
    } catch (err) {
      toast.error("Failed to load resident roster.");
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

  const handleToggleStatus = async (id: string, name: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const toastId = toast.loading(`Updating ${name} access...`);
    try {
      const res = await toggleResidentStatus(id, nextStatus);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(`Resident ${nextStatus === "ACTIVE" ? "activated" : "suspended"}.`, { id: toastId });
        loadResidents();
      }
    } catch (err) {
      toast.error("Operation failed.", { id: toastId });
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete resident ${name}? This will remove all their flat associations and pass logs.`)) {
      return;
    }
    const toastId = toast.loading(`Deleting resident profile...`);
    try {
      const res = await removeResident(id);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success("Resident roster updated.", { id: toastId });
        loadResidents();
      }
    } catch (err) {
      toast.error("Failed to delete resident.", { id: toastId });
    }
  };

  // Filter residents list
  const filteredResidents = residents.filter(res => {
    const matchesSearch = 
      res.user.name.toLowerCase().includes(search.toLowerCase()) ||
      res.email.toLowerCase().includes(search.toLowerCase()) ||
      res.phone.includes(search) ||
      res.flat.number.includes(search);
      
    const matchesBlock = blockFilter === "ALL" || res.flat.block.name === blockFilter;
    
    return matchesSearch && matchesBlock;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Resident Roster</h2>
        <p className="text-xs text-text-secondary">Verify occupancies, suspend lock keys, and configure apartment flats</p>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl glass-panel-heavy">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by resident name, email, flat number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo"
          />
        </div>

        <div>
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
          >
            <option value="ALL">All Blocks / Towers</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
          </select>
        </div>
      </div>

      {/* Roster table */}
      <div className="p-6 rounded-2xl glass-panel-heavy overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : filteredResidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted font-medium">
                  <th className="pb-3">Resident</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Flat & Tower</th>
                  <th className="pb-3">Ownership</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-secondary">
                {filteredResidents.map((res) => (
                  <tr key={res.id} className="hover:bg-white/5">
                    <td className="py-3.5 flex items-center space-x-3">
                      <img
                        src={res.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                        alt={res.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-border/40 bg-slate-800"
                      />
                      <span className="font-semibold text-text-primary">{res.user.name}</span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="flex items-center text-text-primary font-medium">{res.phone}</span>
                        <span className="text-[10px] text-text-muted flex items-center mt-0.5">{res.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="flex items-center font-semibold text-text-primary">
                        <Home className="w-3.5 h-3.5 mr-1 text-brand-indigo" />
                        {res.flat.block.name} - Flat {res.flat.number}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold
                        ${res.isOwner ? "bg-indigo-500/10 text-brand-indigo" : "bg-teal-500/10 text-brand-emerald"}
                      `}>
                        {res.isOwner ? "OWNER" : "TENANT"}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                        ${res.status === "ACTIVE" ? "bg-emerald-500/10 text-brand-emerald" : "bg-red-500/10 text-red-500"}
                      `}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleToggleStatus(res.id, res.user.name, res.status)}
                        className={`p-1.5 rounded-lg border transition-colors
                          ${res.status === "ACTIVE" 
                            ? "border-red-500/20 text-red-500 hover:bg-red-500/10" 
                            : "border-emerald-500/20 text-brand-emerald hover:bg-emerald-500/10"
                          }
                        `}
                        title={res.status === "ACTIVE" ? "Suspend Access" : "Activate Access"}
                      >
                        {res.status === "ACTIVE" ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRemove(res.id, res.user.name)}
                        className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete Profile"
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
            No residents enrolled in the roster system yet.
          </div>
        )}
      </div>

    </div>
  );
}
