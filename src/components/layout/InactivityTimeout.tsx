"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000";

const DEFAULT_INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes default

export default function InactivityTimeout() {
  const { data: session, status } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Helper to perform clean client-side security wipe and log out.
   */
  const handleSignOut = async (reasonMessage: string) => {
    // 1. Invalidate server-side session
    if (session && (session as any).accessToken) {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: (session as any).refreshToken })
        });
      } catch (err) {
        console.error("Backend session invalidation failed:", err);
      }
    }

    // 2. Clear all local storage, session storage, and cache
    localStorage.clear();
    sessionStorage.clear();

    // 3. Clear all browser cookies related to authentication
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // 4. Alert user
    toast.error(reasonMessage, { id: "session-timeout-toast", duration: 6000 });

    // 5. Sign out and redirect to login
    await signOut({ callbackUrl: "/auth/login" });
  };

  const resetInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (status === "authenticated") {
      timeoutRef.current = setTimeout(() => {
        handleSignOut("Your session has expired due to inactivity. Please log in again.");
      }, DEFAULT_INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    // Monitor NextAuth refresh token rotation failures
    if (status === "authenticated" && (session as any)?.error === "RefreshAccessTokenError") {
      handleSignOut("Session has been terminated. Please log in again.");
      return;
    }

    if (status === "authenticated") {
      // Activity events to monitor
      const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
      
      events.forEach((event) => {
        window.addEventListener(event, resetInactivityTimer);
      });

      // Start initial timer
      resetInactivityTimer();

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        events.forEach((event) => {
          window.removeEventListener(event, resetInactivityTimer);
        });
      };
    }
  }, [status, session]);

  return null;
}
