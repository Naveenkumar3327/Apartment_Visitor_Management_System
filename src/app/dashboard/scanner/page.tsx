"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Scan, ShieldCheck, ShieldAlert, Key, ClipboardCheck, ArrowRight, UserCheck, AlertTriangle } from "lucide-react";
import { scanAndVerifyPass } from "@/app/actions/qr";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

export default function QRScannerPage() {
  const { data: session } = useSession();
  const [passCode, setPassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Auto focus the input for rapid gate processing
  useEffect(() => {
    const input = document.getElementById("barcode-input");
    if (input) input.focus();
  }, []);

  if (!session || !["SUPER_ADMIN", "SECURITY_GUARD"].includes(session.user.role)) {
    return (
      <div className="p-6 text-center text-xs text-text-muted glass-panel rounded-2xl">
        Security warning: Access restricted to Greenwood Gate Staff only.
      </div>
    );
  }

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passCode) {
      toast.error("Please enter or scan an invitation pass code.");
      return;
    }

    setLoading(true);
    setScanResult(null);
    setScanError(null);
    
    const toastId = toast.loading("Checking pass credentials on gate logs...");
    try {
      const result = await scanAndVerifyPass(passCode.toUpperCase().trim());
      
      if (result.error) {
        setScanError(result.error);
        toast.error("Access Denied: Pass validation failed.", { id: toastId });
      } else {
        setScanResult(result.visitor);
        toast.success("Access Granted! Visitor checked in.", { id: toastId });
        
        // Trigger high-premium confetti effect for successful VIP entry scan!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });

        // Clear scanned code
        setPassCode("");
      }
    } catch (err) {
      setScanError("Failed to connect to database checkpoint.");
      toast.error("Database connection failure.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Helper to load seeded test code to try it out
  const fillSampleCode = () => {
    setPassCode("INV-88371");
    toast.success("Sample Invite Code loaded!");
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">QR Entry Validation Terminal</h2>
        <p className="text-xs text-text-secondary">Scan visitor passes or key in codes manually to register check-in logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Camera simulation screen */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-4 text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center space-x-2 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-brand-indigo font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo" />
            <span>Camera Station Active</span>
          </div>

          <h3 className="font-heading font-semibold text-sm text-text-primary">Guard Camera Viewport</h3>
          
          {/* Simulated Scanner viewfinder */}
          <div className="relative w-full aspect-video rounded-xl bg-slate-900 border border-border flex flex-col items-center justify-center overflow-hidden">
            {/* Viewfinder brackets */}
            <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-brand-indigo" />
            <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-brand-indigo" />
            <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-brand-indigo" />
            <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-brand-indigo" />
            
            {/* Red scan scanning beam line */}
            <div className="absolute left-0 w-full h-0.5 bg-red-500/50 shadow-md shadow-red-500 top-1/2 -translate-y-1/2 animate-bounce" />

            <div className="text-center space-y-2 relative z-10 px-6">
              <Scan className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
              <p className="text-xs text-text-muted">Place visitor pass QR Code inside the camera scanner area</p>
              <button 
                onClick={fillSampleCode} 
                className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-brand-indigo text-[10px] font-semibold tracking-wider transition-all"
              >
                Use Seeded Pass (INV-88371) to Test
              </button>
            </div>
          </div>
        </div>

        {/* Validation Form and scan response status card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
            <h3 className="font-heading font-semibold text-sm text-text-primary">Key Verification Entry</h3>
            
            <form onSubmit={handleScanSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Pass Shortcode</label>
                <input
                  type="text"
                  id="barcode-input"
                  value={passCode}
                  onChange={(e) => setPassCode(e.target.value)}
                  placeholder="e.g. INV-88371"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm text-center font-mono font-bold tracking-widest text-text-primary focus:outline-none focus:border-brand-indigo transition-all uppercase"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-brand-indigo hover:bg-indigo-500 text-white font-medium text-xs transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Validate Pass</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Validation Status results panel */}
          {(scanResult || scanError) && (
            <div className={`p-6 rounded-2xl border transition-all ${scanResult ? "border-emerald-500/20 bg-emerald-500/5 text-slate-300" : "border-red-500/20 bg-red-500/5 text-slate-300"}`}>
              {scanResult ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center space-x-2 text-brand-emerald font-bold uppercase tracking-wider text-[10px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Granted - Active Inside</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-white text-sm font-bold">{scanResult.name}</p>
                    <p className="text-slate-400">Mobile: {scanResult.phone}</p>
                    <p className="text-slate-400">Destination Flat: <strong className="text-white">{scanResult.flat}</strong></p>
                    <p className="text-slate-400">Host Resident: {scanResult.residentName}</p>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/10 text-[10px] text-emerald-400">
                    Visitor auto-checked in and logged into Gate registers.
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-2 text-red-500 font-bold uppercase tracking-wider text-[10px]">
                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                    <span>Access Denied</span>
                  </div>
                  
                  <p className="text-slate-400 leading-relaxed">{scanError}</p>

                  <div className="flex items-center space-x-1.5 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Verify code format or verify pass expiration limit.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
