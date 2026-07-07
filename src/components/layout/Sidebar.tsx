"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Building2, 
  QrCode, 
  Scan, 
  FileSpreadsheet, 
  LineChart, 
  Bell, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  History, 
  Megaphone,
  User,
  HelpCircle
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = session.user.role;

  // Base navigation visible to everyone
  const commonLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/emergency", label: "Emergency", icon: ShieldAlert, color: "text-red-500" },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  ];

  // Admin exclusive navigation
  const adminLinks = [
    { href: "/dashboard/visitors", label: "Visitors Register", icon: Users },
    { href: "/dashboard/residents", label: "Residents Roster", icon: UserSquare2 },
    { href: "/dashboard/guards", label: "Guards Manager", icon: ShieldAlert },
    { href: "/dashboard/apartments", label: "Apartment Config", icon: Building2 },
    { href: "/dashboard/announcements", label: "Broadcast Notices", icon: Megaphone },
    { href: "/dashboard/reports", label: "Report Center", icon: FileSpreadsheet },
    { href: "/dashboard/analytics", label: "Analytics Stats", icon: LineChart },
    { href: "/dashboard/activity-logs", label: "Audit Logs", icon: History },
  ];

  // Resident exclusive navigation
  const residentLinks = [
    { href: "/dashboard/approvals", label: "Approval Desk", icon: ShieldAlert },
    { href: "/dashboard/qr", label: "Pre-book Invite", icon: QrCode },
    { href: "/dashboard/announcements", label: "Broadcast Notices", icon: Megaphone },
  ];

  // Security Guard exclusive navigation
  const guardLinks = [
    { href: "/dashboard/visitors", label: "Register Visitor", icon: Users },
    { href: "/dashboard/scanner", label: "Scan Pass", icon: Scan },
    { href: "/dashboard/announcements", label: "Broadcast Notices", icon: Megaphone },
  ];

  // Support navigation
  const footerLinks = [
    { href: "/dashboard/profile", label: "My Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/help", label: "Help Center", icon: HelpCircle },
  ];

  // Select navigation set based on role
  let roleSpecificLinks: typeof commonLinks = [];
  if (role === "SUPER_ADMIN" || role === "APARTMENT_ADMIN") {
    roleSpecificLinks = adminLinks;
  } else if (role === "RESIDENT") {
    roleSpecificLinks = residentLinks;
  } else if (role === "SECURITY_GUARD") {
    roleSpecificLinks = guardLinks;
  }

  const allLinks = [...commonLinks.slice(0, 1), ...roleSpecificLinks, ...commonLinks.slice(1)];

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-72 h-screen
        glass-panel border-r border-border transition-transform duration-300 lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:sticky lg:top-0
      `}>
        {/* Branding header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-3" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-purple flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-500/20">
              G
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg leading-tight text-text-primary">Greenwood</h2>
              <span className="text-xs text-text-secondary tracking-widest uppercase font-semibold">Gate Manager</span>
            </div>
          </Link>
        </div>

        {/* User preview */}
        <div className="px-6 py-5 border-b border-border/50 bg-white/5 dark:bg-black/5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold font-heading">
            {session.user.name?.[0].toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-heading font-medium text-sm text-text-primary truncate">{session.user.name}</h4>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-brand-indigo uppercase">
              {role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {allLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? "bg-gradient-to-r from-brand-indigo/10 to-brand-purple/5 text-brand-indigo border-l-4 border-brand-indigo" 
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-brand-indigo" : "text-text-muted group-hover:text-text-primary"} ${link.color || ""}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Settings and log out footer */}
        <div className="p-4 border-t border-border space-y-1.5">
          {footerLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-white/10 text-text-primary" 
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                  }
                `}
              >
                <Icon className="w-4.5 h-4.5 mr-3 text-text-muted" />
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4.5 h-4.5 mr-3 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
