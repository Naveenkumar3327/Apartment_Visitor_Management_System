"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Sun, Moon, Bell, ShieldAlert, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { data: session } = useSession();
  const [time, setTime] = useState("");
  const [isDark, setIsDark] = useState(false);

  // Live Clock effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync theme icon status
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Theme toggle handler
  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 glass-panel border-b border-border">
      {/* Left section: menu drawer toggle & page descriptor */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-white/10 lg:hidden text-text-secondary focus:outline-none"
        >
          <Menu className="w-6 h-6 text-text-primary" />
        </button>
        
        <div className="hidden sm:block">
          <span className="text-xs font-semibold tracking-wider text-text-muted uppercase">Welcome Back</span>
          <h1 className="font-heading font-semibold text-sm text-text-primary">
            {session?.user.name ? `Hello, ${session.user.name.split(" ")[0]}` : "Greenwood Resident"}
          </h1>
        </div>
      </div>

      {/* Right section: live clock, notifications icon, dark-mode toggle, emergency panic */}
      <div className="flex items-center space-x-4">
        {/* Live Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 dark:bg-black/20 border border-border/50 text-xs font-medium text-text-secondary">
          <Clock className="w-4 h-4 text-brand-indigo animate-pulse" />
          <span className="font-mono text-text-primary min-w-[70px]">{time || "00:00:00"}</span>
        </div>

        {/* Emergency Alert quick badge */}
        <Link 
          href="/dashboard/emergency"
          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors animate-pulse"
          title="Emergency Panel"
        >
          <ShieldAlert className="w-5 h-5" />
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-white/10 text-text-secondary transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-xl hover:bg-white/10 text-text-secondary transition-colors"
          title="System Notifications"
        >
          <Bell className="w-5 h-5 text-text-primary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-purple rounded-full" />
        </Link>
      </div>
    </header>
  );
}
