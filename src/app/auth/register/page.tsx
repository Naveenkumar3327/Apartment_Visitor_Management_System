"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, Building, Home, Key, UserCheck } from "lucide-react";
import { registerResident } from "@/app/actions/register";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [blockName, setBlockName] = useState("Block A");
  const [flatNumber, setFlatNumber] = useState("");
  const [isOwner, setIsOwner] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone || !flatNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating secure resident profile...");

    try {
      const result = await registerResident({
        name,
        email,
        passwordHash: password,
        phone,
        blockName,
        flatNumber,
        isOwner,
      });

      if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success("Profile created! Redirecting to login...", { id: toastId });
        router.push("/auth/login");
      }
    } catch (err) {
      toast.error("Failed to connect. Please check network.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-slate-950">
      {/* Decorative Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        
        {/* Branding header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/20 mb-3">
            G
          </div>
          <h2 className="font-heading font-bold text-2xl text-white">Resident Registration</h2>
          <p className="text-xs text-slate-400 mt-1">Enroll your flat into Greenwood Gate Security Systems</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditya Sen"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-slate-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98989 89898"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-slate-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
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
            </div>

            {/* Flat Specifics */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Block / Tower</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-slate-900/40 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                  >
                    <option value="Block A" className="bg-slate-900 text-white">Block A</option>
                    <option value="Block B" className="bg-slate-900 text-white">Block B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Flat Number</label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="101"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-slate-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Security Password</label>
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
            </div>
          </div>

          {/* Owner Tenant toggle */}
          <div className="flex items-center space-x-3 p-3 rounded-xl border border-white/5 bg-slate-900/20">
            <input
              type="checkbox"
              id="isOwner"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
              className="w-4 h-4 text-brand-indigo rounded focus:ring-brand-indigo bg-slate-900 border-white/10"
            />
            <label htmlFor="isOwner" className="text-xs font-medium text-slate-300">
              I am the legal Owner of this Flat (Uncheck if Tenant)
            </label>
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
                <span>Create Safe Account</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center pt-2">
          <span className="text-xs text-slate-400">Already registered? </span>
          <button 
            onClick={() => router.push("/auth/login")}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Sign In Here
          </button>
        </div>

      </div>
    </div>
  );
}
