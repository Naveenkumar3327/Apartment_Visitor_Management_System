"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldAlert, Key, UserCheck, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Display error messages from nextauth url params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "CredentialsSignin") {
      toast.error("Invalid email or password");
    } else if (error === "AccessDenied") {
      toast.error("Security alert: Access Denied to page");
    }
  }, [searchParams]);

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying security credentials...");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success("Access Granted! Loading session...", { id: toastId });
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Authentication failed. Connection issue.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Helper to auto-fill sample testing accounts
  const handleQuickFill = (role: string) => {
    if (role === "SUPER_ADMIN") {
      setEmail("superadmin@visitor.com");
      setPassword("password123");
    } else if (role === "APARTMENT_ADMIN") {
      setEmail("admin@visitor.com");
      setPassword("password123");
    } else if (role === "SECURITY_GUARD") {
      setEmail("guard@visitor.com");
      setPassword("password123");
    } else if (role === "RESIDENT") {
      setEmail("resident@visitor.com");
      setPassword("password123");
    }
    toast.success(`${role.replace("_", " ")} credentials filled!`);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-slate-950">
      {/* Decorative Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        
        {/* Logo and title */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/20 mb-3">
            G
          </div>
          <h2 className="font-heading font-bold text-2xl text-white">Greenwood Gate</h2>
          <p className="text-xs text-slate-400 mt-1">Smart Apartment Visitor Management Platform</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@greenwood.com"
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-slate-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Password</label>
              <button 
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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
                <span>Verify & Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <span className="block text-center text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            Fast Track Developer Access
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickFill("SUPER_ADMIN")}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Super Admin</span>
            </button>
            <button
              onClick={() => handleQuickFill("APARTMENT_ADMIN")}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Apt Admin</span>
            </button>
            <button
              onClick={() => handleQuickFill("SECURITY_GUARD")}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guard</span>
            </button>
            <button
              onClick={() => handleQuickFill("RESIDENT")}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Resident</span>
            </button>
          </div>
        </div>

        {/* Signup shortcut */}
        <div className="text-center pt-2">
          <span className="text-xs text-slate-400">New Resident? </span>
          <button 
            onClick={() => router.push("/auth/register")}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Create Resident Account
          </button>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white text-sm">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Loading Greenwood Gate desk...</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
