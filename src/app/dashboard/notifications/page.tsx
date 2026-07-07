"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, CheckCircle2, Trash2, Mail, Phone, MessageCircle } from "lucide-react";
import { getNotificationsList, markNotificationRead, clearAllNotifications } from "@/app/actions/notification";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const { data: session } = useSession();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotificationsList();
      setNotifications(data);
    } catch (err) {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationRead(id);
      if (!res.error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all your notification logs?")) return;
    const toastId = toast.loading("Clearing log alerts...");
    try {
      const res = await clearAllNotifications();
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(res.message, { id: toastId });
        setNotifications([]);
      }
    } catch (err) {
      toast.error("Operation failed.", { id: toastId });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "EMAIL": return <Mail className="w-4 h-4 text-brand-indigo" />;
      case "SMS": return <Phone className="w-4 h-4 text-brand-emerald" />;
      case "WHATSAPP": return <MessageCircle className="w-4 h-4 text-teal-400" />;
      default: return <Bell className="w-4 h-4 text-brand-purple" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">System Dispatch Inbox</h2>
          <p className="text-xs text-text-secondary">Alert dispatch logs, resident approvals notifications, and emergency signals</p>
        </div>
        
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Inbox</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-14 w-full bg-white/5 rounded-xl animate-pulse" />
            <div className="h-14 w-full bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((note) => (
              <div 
                key={note.id}
                onClick={() => !note.isRead && handleMarkRead(note.id)}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all cursor-pointer
                  ${note.isRead 
                    ? "border-border bg-white/5 opacity-70" 
                    : "border-brand-indigo/30 bg-brand-indigo/5 shadow-md"
                  }
                `}
              >
                <div className="flex items-start space-x-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-border flex items-center justify-center mt-0.5">
                    {getIcon(note.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary flex items-center space-x-1.5">
                      <span>{note.title}</span>
                      {!note.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo inline-block animate-pulse" />}
                    </h4>
                    <p className="text-text-secondary mt-1">{note.message}</p>
                    <span className="text-[9px] text-text-muted block mt-1">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!note.isRead && (
                  <button 
                    className="p-1 text-text-muted hover:text-brand-indigo"
                    title="Mark as Read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-xs text-text-muted flex flex-col items-center justify-center space-y-2">
            <Bell className="w-12 h-12 text-indigo-500/25" />
            <span>Inbox is clear. No new notifications.</span>
          </div>
        )}
      </div>

    </div>
  );
}
