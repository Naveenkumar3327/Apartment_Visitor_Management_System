"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, Save, MapPin, Phone, ShieldCheck, Home, Plus, Trash2 } from "lucide-react";
import { getApartmentConfig, updateApartmentConfig } from "@/app/actions/apartment-config";
import toast from "react-hot-toast";

export default function ApartmentConfigPage() {
  const { data: session } = useSession();
  
  const [apt, setApt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  
  // Emergency contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newPhone, setNewPhone] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await getApartmentConfig();
      if (config) {
        setApt(config);
        setName(config.name);
        setAddress(config.address);
        if (config.emergencyContacts) {
          setContacts(JSON.parse(config.emergencyContacts));
        }
      }
    } catch (err) {
      toast.error("Failed to load complex configuration.");
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

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPhone) {
      toast.error("Contact details incomplete.");
      return;
    }
    setContacts(prev => [...prev, { title: newTitle, phone: newPhone }]);
    setNewTitle("");
    setNewPhone("");
    toast.success("Emergency contact appended locally. Click Save to commit.");
  };

  const handleRemoveContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
    toast.success("Contact removed locally.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      toast.error("Name and Address cannot be empty.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving configuration updates...");
    
    try {
      const result = await updateApartmentConfig(apt.id, name, address, JSON.stringify(contacts));
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(result.message, { id: toastId });
        loadConfig();
      }
    } catch (err) {
      toast.error("Save operation failed.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Apartment Settings & Blocks Mapping</h2>
        <p className="text-xs text-text-secondary">Configure community profile parameters, address records, and helpline directories</p>
      </div>

      {loading ? (
        <div className="h-60 w-full glass-panel rounded-2xl animate-pulse" />
      ) : apt ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* General Config form */}
          <form onSubmit={handleSave} className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-6">
            <h3 className="font-heading font-semibold text-sm text-text-primary">Apartment General Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Apartment Complex Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Greenwood Heights"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Postal Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-[18px] w-4 h-4 text-text-muted" />
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Road Address"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Blocks and Flats stat overview */}
            <div className="pt-6 border-t border-border space-y-3">
              <h4 className="font-heading font-semibold text-xs text-text-muted uppercase tracking-wider">Blocks Mapping Audit</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <span className="text-[10px] text-text-secondary block">Towers</span>
                  <span className="text-lg font-bold text-text-primary">{apt.blocksCount} Blocks</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <span className="text-[10px] text-text-secondary block">Floors</span>
                  <span className="text-lg font-bold text-text-primary">{apt.floorsCount} Storeys</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <span className="text-[10px] text-text-secondary block">Total Flats</span>
                  <span className="text-lg font-bold text-text-primary">{apt.flatsCount} Units</span>
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
                  <span>Save Profile Updates</span>
                </>
              )}
            </button>
          </form>

          {/* Emergency contacts editor */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Emergency Helpdesk Contacts</h3>
              
              {/* Add form */}
              <form onSubmit={handleAddContact} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Helpline Title (e.g. Fire Gate)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo"
                  />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo"
                  />
                  <button
                    type="submit"
                    className="px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-brand-indigo text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </form>

              {/* Contacts List */}
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 pt-2 border-t border-border/50">
                {contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-white/5 text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">{contact.title}</span>
                      <span className="text-[10px] text-text-muted flex items-center mt-0.5">
                        <Phone className="w-3 h-3 mr-1 text-brand-indigo" /> {contact.phone}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveContact(idx)}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-12 text-center text-xs text-text-muted">
          No active apartment complex configured.
        </div>
      )}

    </div>
  );
}
