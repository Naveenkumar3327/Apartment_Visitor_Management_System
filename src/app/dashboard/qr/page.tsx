"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { QrCode, Download, Printer, Share2, Clipboard, ShieldCheck, ArrowRight, User, Phone, Users, Clock } from "lucide-react";
import { createPreBookedPass } from "@/app/actions/qr";
import toast from "react-hot-toast";
import QRCode from "qrcode";

export default function QRInvitePage() {
  const { data: session } = useSession();

  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorType, setVisitorType] = useState("Guest");
  const [expiryHours, setExpiryHours] = useState(24);
  const [loading, setLoading] = useState(false);

  // Generated pass state
  const [generatedPass, setGeneratedPass] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const passCardRef = useRef<HTMLDivElement>(null);

  // Generate local QR base64 once the pass is returned
  useEffect(() => {
    if (generatedPass) {
      // The QR code contains the invitation shortcode
      QRCode.toDataURL(generatedPass.code, {
        width: 200,
        margin: 2,
        color: {
          dark: "#0f172a", // slate 900
          light: "#ffffff",
        }
      })
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.error("QR Code generation error:", err);
        });
    }
  }, [generatedPass]);

  if (!session || session.user.role !== "RESIDENT") {
    return (
      <div className="p-6 text-center text-xs text-text-muted glass-panel rounded-2xl">
        Security notice: Access restricted to Greenwood Residents only.
      </div>
    );
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone) {
      toast.error("Please fill in visitor name and phone number.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Encrypting invitation pass details...");
    try {
      const result = await createPreBookedPass({
        visitorName,
        visitorPhone,
        visitorType,
        expiryHours: Number(expiryHours),
      });

      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(result.message ?? "Pass generated successfully!", { id: toastId });
        setGeneratedPass(result.pass);
        // Clear input form
        setVisitorName("");
        setVisitorPhone("");
      }
    } catch (err) {
      toast.error("Failed to compile pass.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Helper to copy shortcode text
  const copyToClipboard = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass.code);
      toast.success("Invitation code copied to clipboard!");
    }
  };

  // Print pass card
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Page Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Pre-book Visitor / Invite Guest</h2>
        <p className="text-xs text-text-secondary">Generate secure, short-lived digital entry credentials for your visitors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Invite Form */}
        <div className="p-6 rounded-2xl glass-panel-heavy space-y-6">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Visitor Pass Specifications</h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Visitor Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Rohan Deshmukh"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="+91 95555 66666"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Visitor Type</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select
                    value={visitorType}
                    onChange={(e) => setVisitorType(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors appearance-none"
                  >
                    <option value="Guest">Guest / Friend</option>
                    <option value="Delivery">Delivery Agent</option>
                    <option value="Maintenance">Maintenance Contractor</option>
                    <option value="Domestic Help">Domestic Help</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Pass Validity</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors appearance-none"
                  >
                    <option value={4}>4 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={48}>2 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Generate Pass & QR Code</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Display Pass Visualizer */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-sm text-text-primary">Generated Gate Pass Card</h3>

          {generatedPass ? (
            <div className="space-y-4">
              {/* Premium ticket pass container */}
              <div
                ref={passCardRef}
                className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl max-w-sm mx-auto space-y-6 text-center relative overflow-hidden"
              >
                {/* Visual dotted ticket separator side-notches */}
                <div className="absolute top-1/2 left-0 w-3 h-6 -translate-y-1/2 rounded-r-full bg-slate-950/20 border-r border-slate-200" />
                <div className="absolute top-1/2 right-0 w-3 h-6 -translate-y-1/2 rounded-l-full bg-slate-950/20 border-l border-slate-200" />

                {/* Header card info */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold">Greenwood Heights Gate Pass</span>
                  <h4 className="font-heading font-extrabold text-lg tracking-tight">VIP ENTRY TICKET</h4>
                </div>

                {/* QR Code element */}
                <div className="flex items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-xl w-48 h-48 mx-auto">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code Ticket" className="w-44 h-44 object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 rounded animate-pulse" />
                  )}
                </div>

                {/* Code display */}
                <div className="space-y-1 bg-slate-50 border border-slate-100 py-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-semibold">TICKET ID / CODE</span>
                  <span className="font-mono font-bold text-sm tracking-widest text-indigo-600 uppercase flex items-center justify-center space-x-1.5">
                    <span>{generatedPass.code}</span>
                    <button
                      onClick={copyToClipboard}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 transition-colors"
                      title="Copy code"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>

                {/* Visitor & flat metadata */}
                <div className="grid grid-cols-2 gap-4 text-left text-xs border-t border-dashed border-slate-200 pt-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Visitor</span>
                    <span className="font-bold truncate block">{generatedPass.visitorName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Destination</span>
                    <span className="font-bold block">Flat {generatedPass.flatNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Expiry Limit</span>
                    <span className="font-medium text-amber-600 block">
                      {new Date(generatedPass.expiryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-[10px] text-emerald-600 font-semibold pt-2 border-t border-slate-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Digital Pass</span>
                </div>
              </div>

              {/* Utility actions */}
              <div className="flex items-center justify-center space-x-4 max-w-sm mx-auto">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 text-text-primary text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2.5 rounded-xl bg-brand-indigo text-white hover:bg-indigo-500 text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Pass Link</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-text-muted glass-panel rounded-2xl flex flex-col items-center justify-center space-y-3">
              <QrCode className="w-12 h-12 text-brand-indigo/20" />
              <span>Fill out the form and submit to preview your VIP invite ticket here.</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
