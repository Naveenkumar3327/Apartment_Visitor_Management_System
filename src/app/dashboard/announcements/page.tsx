"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Megaphone, Plus, Calendar, ShieldAlert, Bell, Mail, Info } from "lucide-react";
import { getAnnouncements, createAnnouncement } from "@/app/actions/announcement";
import toast from "react-hot-toast";

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Create notice form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("NOTICE");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNotices();
  }, [activeTab]);

  const loadNotices = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      toast.error("Failed to load notice board bulletins.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;
  const isAdmin = ["SUPER_ADMIN", "APARTMENT_ADMIN"].includes(session.user.role);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Please fill in notice title and body content.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Broadcasting notice to residents...");
    try {
      const res = await createAnnouncement({ title, content, type });
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        setTitle("");
        setContent("");
        setActiveTab("list");
      }
    } catch (err) {
      toast.error("Failed to post notice.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Apartment Broadcast Noticeboard</h2>
          <p className="text-xs text-text-secondary">Read official circulars, water scheduling notices, and community broadcasts</p>
        </div>

        <div className="flex bg-white/5 border border-border p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "list" ? "bg-brand-indigo text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
          >
            Bulletin List
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${activeTab === "create" ? "bg-brand-indigo text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab: LIST */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-28 w-full bg-white/5 rounded-2xl animate-pulse" />
              <div className="h-28 w-full bg-white/5 rounded-2xl animate-pulse" />
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((note) => (
                <div key={note.id} className="p-6 rounded-2xl glass-panel-heavy space-y-4 flex flex-col justify-between border-l-4 border-l-brand-indigo">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase
                        ${note.type === "EMERGENCY" ? "bg-red-500/10 text-red-500" : ""}
                        ${note.type === "MAINTENANCE" ? "bg-amber-500/10 text-amber-500" : ""}
                        ${note.type === "FESTIVAL" ? "bg-purple-500/10 text-brand-purple" : ""}
                        ${note.type === "NOTICE" ? "bg-indigo-500/10 text-brand-indigo" : ""}
                      `}>
                        {note.type}
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(note.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-text-primary">{note.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{note.content}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-border/40 flex items-center space-x-1.5 text-[9px] text-text-muted">
                    <Info className="w-3 h-3 text-brand-indigo" />
                    <span>Dispatched to all residents via app push alert.</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-text-muted glass-panel rounded-2xl flex flex-col items-center justify-center space-y-3">
              <Megaphone className="w-12 h-12 text-indigo-500/25" />
              <span>The bulletin notice board is empty.</span>
            </div>
          )}
        </div>
      )}

      {/* Tab: CREATE COMPOSER */}
      {activeTab === "create" && isAdmin && (
        <form onSubmit={handleCreateSubmit} className="p-6 rounded-2xl glass-panel-heavy space-y-6 max-w-xl mx-auto">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Compose Broadcast Notice</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Notice Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Water Tank Cleaning Schedule"
                className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Notice Type Classification</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-sm text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
              >
                <option value="NOTICE">Standard Circular Announcement</option>
                <option value="MAINTENANCE">Maintenance / Utility Interruptions</option>
                <option value="FESTIVAL">Festival Circulars & Holidays</option>
                <option value="EMERGENCY">Emergency / Security Alarm warnings</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Bulletin Message Body</label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write notice details clearly. Mapped residents will receive a real-time push alert notification on their dashboard panels..."
                className="w-full p-4 rounded-xl border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                <span>Broadcast Notice Bulletin</span>
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}
