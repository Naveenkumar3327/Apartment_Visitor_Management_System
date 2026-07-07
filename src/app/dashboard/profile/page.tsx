"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, Save, Key, Car, Phone, Info } from "lucide-react";
import { getProfileData, updateProfileData } from "@/app/actions/profile";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfileData();
      if (data) {
        setProfile(data);
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.resident?.phone || data.guard?.phone || "");
      }
    } catch (err) {
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Name and Email cannot be blank.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Updating profile details...");
    
    try {
      const res = await updateProfileData(name, email, phone || undefined);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        
        // Update Session context client-side
        await update({ name, email });
        
        loadProfile();
      }
    } catch (err) {
      toast.error("Operation failed.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Personal Security Profile</h2>
        <p className="text-xs text-text-secondary">View credentials, register vehicles, and edit general fields</p>
      </div>

      {loading ? (
        <div className="h-64 w-full glass-panel rounded-2xl animate-pulse" />
      ) : profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main profile form card */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-6">
            <h3 className="font-heading font-semibold text-sm text-text-primary">Credentials Settings</h3>
            
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
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Mobile Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Provide mobile number"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Authentication Role</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    disabled
                    value={profile.user.role.replace("_", " ")}
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/10 text-sm font-semibold text-indigo-400 cursor-not-allowed uppercase"
                  />
                </div>
              </div>
            </div>

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
                  <span>Commit Profile Updates</span>
                </>
              )}
            </button>
          </form>

          {/* Role-Specific details card */}
          <div className="space-y-6">
            
            {/* If Resident profile: list vehicles and flats */}
            {profile.resident && (
              <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
                <h3 className="font-heading font-semibold text-sm text-text-primary">Flat & Vehicular Metadata</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-border bg-white/5">
                    <span className="text-[10px] text-text-muted block font-semibold uppercase">Flat Location</span>
                    <span className="text-xs font-bold text-text-primary">
                      {profile.resident.flat.block.name} - Unit {profile.resident.flat.number}
                    </span>
                  </div>
                  
                  {profile.resident.vehicleDetails && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-text-secondary block font-semibold uppercase">Registered Vehicles</span>
                      {JSON.parse(profile.resident.vehicleDetails).map((veh: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-text-secondary bg-white/5 p-2 rounded-lg border border-border">
                          <Car className="w-4 h-4 text-brand-indigo" />
                          <span>{veh.plate} ({veh.make || veh.type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* If Guard profile: show gate shifts and review rating */}
            {profile.guard && (
              <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
                <h3 className="font-heading font-semibold text-sm text-text-primary">Guard Incident Metrics</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl border border-border bg-white/5">
                    <span className="text-[10px] text-text-muted block uppercase">Assigned gate station</span>
                    <span className="font-bold text-text-primary">{profile.guard.assignedGate}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-white/5">
                    <span className="text-[10px] text-text-muted block uppercase">Guard Shift scheduling</span>
                    <span className="font-bold text-text-primary">{profile.guard.shift} SHIFT</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-white/5">
                    <span className="text-[10px] text-text-muted block uppercase">Incident Performance score</span>
                    <span className="font-bold text-brand-indigo">{profile.guard.performance.toFixed(1)} / 5.0 Rating</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-muted">
          Failed to load profile.
        </div>
      )}

    </div>
  );
}
