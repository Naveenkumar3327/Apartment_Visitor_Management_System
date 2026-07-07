"use client";

import React, { useEffect } from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error reporter
    console.error("System crash error:", error);
  }, [error]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-slate-950 text-slate-100">
      {/* Decorative Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10 text-center space-y-6">
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="font-heading font-extrabold text-4xl text-white">500 Error</h2>
          <h3 className="font-heading font-bold text-lg text-red-400">System Pipeline Interrupted</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            An unexpected transaction database error or route failure has interrupted your session request.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all space-x-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Session</span>
        </button>

      </div>
    </div>
  );
}
