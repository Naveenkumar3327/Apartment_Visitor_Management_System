"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authenticating state loading check
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin" />
        <span className="mt-4 font-heading text-sm text-text-secondary animate-pulse">Initializing Gate Systems...</span>
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (status === "unauthenticated") {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content viewport */}
      <div className="flex flex-col flex-1 min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Dynamic page contents wrapper */}
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
