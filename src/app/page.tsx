"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  QrCode, 
  BellRing, 
  FilePieChart, 
  Lock, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Menu,
  X,
  Activity,
  HeartHandshake,
  MessagesSquare
} from "lucide-react";
import toast from "react-hot-toast";

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      toast.error("Please fill out all fields");
      return;
    }
    setSendingMsg(true);
    setTimeout(() => {
      setSendingMsg(false);
      toast.success("Message transmitted successfully!");
      setContactName("");
      setContactEmail("");
      setContactMsg("");
    }, 1200);
  };

  const features = [
    {
      title: "Real-Time Approvals",
      desc: "Instant notifications sent to residents' devices. Grant or deny guest entry with a single tap.",
      icon: BellRing,
      color: "text-amber-400"
    },
    {
      title: "QR Code Invitation Passes",
      desc: "Pre-book guests and generate unique, expiring QR code entry passes for instant guard validation.",
      icon: QrCode,
      color: "text-blue-400"
    },
    {
      title: "Guard Station Integration",
      desc: "Simple, tablet-ready interface for security staff with camera photo capture and quick QR scanning.",
      icon: ShieldCheck,
      color: "text-emerald-400"
    },
    {
      title: "Analytical Reports",
      desc: "Export Excel, CSV or print PDF logs. Chart peak traffic hours, guard audits, and visitor metrics.",
      icon: FilePieChart,
      color: "text-purple-400"
    },
    {
      title: "Emergency Panic Alerts",
      desc: "Instant broadcast systems for medical emergencies, fire alerts, or security assistance.",
      icon: Activity,
      color: "text-red-500"
    },
    {
      title: "Multi-Apartment Setup",
      desc: "Seamless administration of complexes, block mappings, floors, flats, and staff rosters.",
      icon: Building2,
      color: "text-indigo-400"
    }
  ];

  const pricing = [
    {
      name: "Starter Gate",
      price: "$29",
      desc: "Best for single-tower housing societies.",
      features: [
        "Up to 50 flats",
        "2 Security guard accounts",
        "SMS visitor notifications",
        "PDF logs monthly reports",
        "Standard email support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Smart Community",
      price: "$79",
      desc: "Recommended for modern gated complexes.",
      features: [
        "Up to 250 flats",
        "10 Security guard accounts",
        "Real-time app push notifications",
        "QR pass generation & scanning",
        "Live analytical dashboards",
        "Emergency panic trigger system",
        "Priority 24/7 support"
      ],
      cta: "Go Premium",
      popular: true
    },
    {
      name: "Enterprise Tower",
      price: "$199",
      desc: "For large premium luxury societies.",
      features: [
        "Unlimited flats & blocks",
        "Unlimited security staff",
        "AI visitor repeat insights",
        "Camera face-capture ready integration",
        "API integration with WhatsApp",
        "Audit log histories (forever)",
        "Dedicated Account Executive"
      ],
      cta: "Contact Enterprise",
      popular: false
    }
  ];

  const faqs = [
    {
      q: "How does the resident approval workflow operate?",
      a: "When a guest arrives at the gate, the security guard submits their details. The system immediately triggers a push notification to the resident's mobile app. The resident clicks 'Approve' or 'Reject', which updates the guard's monitor in real-time, allowing entry."
    },
    {
      q: "Can residents invite guests in advance?",
      a: "Yes! Residents can pre-book visitors via their dashboard. The system generates a secure, unique QR Pass with a custom expiration limit (e.g. 24 hours). The guest displays the QR on their phone at the gate, the guard scans it, and they check in instantly."
    },
    {
      q: "What database triggers are used during emergencies?",
      a: "When a resident presses the Panic Button, a high-priority alert is registered in the database. Instantly, push alerts are sent to the accounts of all assigned guards and managers, showing the resident's name, flat number, and contact details."
    },
    {
      q: "Can we switch between SQLite and PostgreSQL?",
      a: "Absolutely! The system utilizes Prisma ORM. For testing and development, it compiles directly on SQLite. To migrate to PostgreSQL in staging or production, simply configure your DATABASE_URL in the .env and update the provider in schema.prisma."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header NavBar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg">
              G
            </div>
            <span className="font-heading font-bold text-lg text-white">Greenwood Gate</span>
          </div>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/auth/login" className="text-sm font-semibold hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/25 transition-all"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="p-2 md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/5 bg-slate-950 px-6 py-6 space-y-4 flex flex-col text-sm font-medium">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <hr className="border-white/5" />
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors block">
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              onClick={() => setMobileMenuOpen(false)} 
              className="w-full text-center py-2.5 text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 block"
            >
              Sign Up
            </Link>
          </div>
        )}
      </header>

      {/* Hero section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center space-y-8">
        <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
          <span>V15.0 Production Ready Platform</span>
        </span>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-none max-w-4xl mx-auto">
          Digital Visitor Registration for <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
            Modern Safe Residences
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Replace outdated paper logbooks with our digital SaaS visitor management solution. Enable instant resident tap-approvals, QR passes, real-time security tracking, and audit trail metrics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => router.push("/auth/login")}
            className="w-full sm:w-auto px-6 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 group"
          >
            <span>Access Guard & Admin Desk</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => router.push("/auth/register")}
            className="w-full sm:w-auto px-6 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center"
          >
            Register Your Apartment Flat
          </button>
        </div>

        {/* Floating statistics dashboard mockup preview */}
        <div className="pt-12 max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-colors" />
          <div className="p-1 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="rounded-xl border border-white/5 bg-slate-950 p-6 flex flex-col md:flex-row md:items-center md:justify-around gap-6 text-left">
              <div>
                <span className="block text-2xl font-bold font-heading text-white">99.99%</span>
                <span className="text-xs text-slate-400">Guaranteed Entry Uptime</span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-white/5 md:pl-8 pt-4 md:pt-0">
                <span className="block text-2xl font-bold font-heading text-white">&lt; 3 Seconds</span>
                <span className="text-xs text-slate-400">Push Alert Dispatch Latency</span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-white/5 md:pl-8 pt-4 md:pt-0">
                <span className="block text-2xl font-bold font-heading text-white">100k +</span>
                <span className="text-xs text-slate-400">Visitor Passes Validated</span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-white/5 md:pl-8 pt-4 md:pt-0">
                <span className="block text-2xl font-bold font-heading text-white">Zero Paper</span>
                <span className="text-xs text-slate-400">Eco-Friendly Digital Registers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Built for Guards, Residents, and Admins
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Every screen is tailored for maximum utility and aesthetics. Beautiful glass layout frameworks combined with responsive modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="p-6 rounded-2xl border border-white/5 bg-slate-900/30 hover:border-white/10 hover:bg-slate-900/50 transition-all space-y-4 group">
                <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">Transparent Pricing Plans</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Scale seamlessly as your resident database expands. No hidden platform costs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {pricing.map((p, i) => (
            <div 
              key={i} 
              className={`p-8 rounded-2xl border relative flex flex-col justify-between space-y-6 transition-all
                ${p.popular 
                  ? "bg-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-500/5 lg:scale-105 z-10" 
                  : "bg-slate-900/30 border-white/5 hover:border-white/10"
                }
              `}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase tracking-widest">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <span className="text-sm font-semibold text-slate-400 uppercase">{p.name}</span>
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold font-heading text-white">{p.price}</span>
                  <span className="text-slate-400 text-sm ml-2">/ month</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                <hr className="border-white/5" />
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 mr-2.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => router.push("/auth/register")}
                className={`w-full h-11 mt-6 rounded-xl font-medium text-xs transition-all flex items-center justify-center
                  ${p.popular 
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
                    : "bg-white/5 hover:bg-white/10 text-white"
                  }
                `}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-white/5 space-y-12">
        <h2 className="font-heading font-bold text-3xl text-center text-white">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-slate-900/20 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left font-medium text-sm text-white hover:bg-white/5 transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                <span className="text-indigo-400 font-bold text-lg leading-none">{activeFaq === i ? "−" : "+"}</span>
              </button>
              {activeFaq === i && (
                <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5 bg-slate-950/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-lg mx-auto px-6 py-24 border-t border-white/5 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="font-heading font-bold text-3xl text-white">Get in Touch</h2>
          <p className="text-slate-400 text-xs">Request a personalized security walkthrough for your society.</p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4 p-6 rounded-2xl border border-white/5 bg-slate-900/30">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="President Aditya Sen"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="aditya.sen@greenwood.com"
              className="w-full h-11 px-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Message</label>
            <textarea
              rows={4}
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              placeholder="We are looking to implement a digitised entry system for 3 Blocks..."
              className="w-full p-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sendingMsg}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {sendingMsg ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <MessagesSquare className="w-4 h-4" />
                <span>Submit Query</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 py-12 text-center text-xs text-slate-500 space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-extrabold text-xs">
            G
          </div>
          <span className="font-heading font-semibold text-white">Greenwood Gate Inc.</span>
        </div>
        <p>© 2026 Greenwood Gate Systems. All rights reserved. Registered under ISO-27001 Security Standard guidelines.</p>
        <div className="flex items-center justify-center space-x-6">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
          <a href="#" className="hover:text-slate-300">Help Center</a>
        </div>
      </footer>

    </div>
  );
}
