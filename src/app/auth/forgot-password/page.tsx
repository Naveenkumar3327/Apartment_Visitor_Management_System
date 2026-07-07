"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Key } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Security reset link dispatched!");
    }, 1500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-slate-950">
      {/* Decorative Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        
        {/* Branding header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/20 mb-3">
            G
          </div>
          <h2 className="font-heading font-bold text-2xl text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">Recover access to your Greenwood Security account</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-brand-emerald flex items-center justify-center mx-auto border border-emerald-500/20">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-white">Check Your Inbox</h3>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              We have dispatched a secure password override link to <strong>{email}</strong>. Check spam if you do not receive it in 2 minutes.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-center mx-auto space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-slate-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] text-white hover:bg-right font-medium text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Send Recovery Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="w-full text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-center space-x-1 pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel & Back</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
