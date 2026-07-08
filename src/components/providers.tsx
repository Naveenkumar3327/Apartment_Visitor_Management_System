"use client";

import React, { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import InactivityTimeout from "@/components/layout/InactivityTimeout";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Standard system theme check
    const isDark = localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <SessionProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: "glass-panel text-text-primary border-border",
          style: {
            background: "var(--bg-surface-solid)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-glass)",
            backdropFilter: "blur(10px)",
          },
        }}
      />
      <InactivityTimeout />
      {children}
    </SessionProvider>
  );
}
