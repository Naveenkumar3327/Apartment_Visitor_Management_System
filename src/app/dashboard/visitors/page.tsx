"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Camera, 
  UserPlus, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  Building,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { registerAndCheckIn, checkOutVisitor, toggleVisitorBlacklist } from "@/app/actions/visitor";
import { getReportFilterMetadata } from "@/app/actions/report";
import toast from "react-hot-toast";

const VISITOR_TYPES = ["Guest", "Delivery", "Maintenance", "Courier", "Cab Driver", "Food Delivery", "Domestic Help", "Vendor", "Other"];
const PURPOSES = ["GUEST", "DELIVERY", "MAINTENANCE", "COURIER", "CAB", "FOOD", "DOMESTIC_HELP", "VENDOR", "OTHER"];

// Sample visitor mock photos to simulate camera snap in local tests
const MOCK_PHOTOS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
];

export default function VisitorsPage() {
  const { data: session } = useSession();
  
  // Tab states: 'list' or 'register'
  const [activeTab, setActiveTab] = useState<"list" | "register">("list");
  
  // List states
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Registration form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [purpose, setPurpose] = useState("GUEST");
  const [vehicle, setVehicle] = useState("");
  const [flatId, setFlatId] = useState("");
  const [visitorType, setVisitorType] = useState("Guest");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [flatsList, setFlatsList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Camera settings states
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    loadLogs();
    loadFilterMetadata();
  }, [activeTab]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Fetch directly from API route (we will create `/api/visitors` next)
      const res = await fetch("/api/visitors");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      toast.error("Failed to load visitor logs registry.");
    } finally {
      setLoading(false);
    }
  };

  const loadFilterMetadata = async () => {
    try {
      const meta = await getReportFilterMetadata();
      if (meta && "flats" in meta) {
        setFlatsList(meta.flats);
        if (meta.flats.length > 0) setFlatId(meta.flats[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) return null;
  const isGuard = session.user.role === "SECURITY_GUARD";
  const isAdmin = ["SUPER_ADMIN", "APARTMENT_ADMIN"].includes(session.user.role);

  // Camera controller
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setStream(videoStream);
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
    } catch (err) {
      console.warn("Camera device not supported or blocked. Simulating capture...");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (stream && videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        setPhotoUrl(canvas.toDataURL("image/jpeg"));
      }
      stopCamera();
      toast.success("Visitor photograph captured!");
    } else {
      // Simulate/mock photo snap from library
      const idx = Math.floor(Math.random() * MOCK_PHOTOS.length);
      setPhotoUrl(MOCK_PHOTOS[idx]);
      setCameraActive(false);
      toast.success("Visitor photograph simulated successfully!");
    }
  };

  // Submit check-in handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !flatId) {
      toast.error("Please fill in visitor name, mobile, and flat number.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving registration details...");
    
    try {
      const result = await registerAndCheckIn({
        name,
        phone,
        email,
        gender,
        address,
        idType,
        idNumber,
        purpose,
        vehicleNumber: vehicle,
        flatId,
        visitorType,
        notes,
        photoUrl,
      });

      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(result.message, { id: toastId });
        // Reset form
        setName("");
        setPhone("");
        setEmail("");
        setVehicle("");
        setNotes("");
        setPhotoUrl("");
        // Switch back to registry
        setActiveTab("list");
      }
    } catch (err) {
      toast.error("Failed to compile visitor check-in.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutLog = async (logId: string) => {
    const toastId = toast.loading("Checking out visitor...");
    try {
      const result = await checkOutVisitor(logId);
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(result.message, { id: toastId });
        loadLogs();
      }
    } catch (err) {
      toast.error("Connection failed.", { id: toastId });
    }
  };

  const handleToggleBlacklist = async (visitorId: string, name: string, isBlacklisted: boolean) => {
    const action = isBlacklisted ? "blacklist" : "remove blacklist";
    const reason = isBlacklisted ? "Flagged suspicious activity by security guard" : "";
    const toastId = toast.loading(`Updating blacklist for ${name}...`);
    
    try {
      const result = await toggleVisitorBlacklist(visitorId, isBlacklisted, reason);
      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(`Visitor ${name} ${isBlacklisted ? "blacklisted" : "whitelisted"}.`, { id: toastId });
        loadLogs();
      }
    } catch (err) {
      toast.error("Connection failed.", { id: toastId });
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.visitor.name.toLowerCase().includes(search.toLowerCase()) ||
      log.visitor.phone.includes(search) ||
      log.flat.number.includes(search);
      
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    const matchesType = typeFilter === "ALL" || log.visitorType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Gate Registers & Checkpoint</h2>
          <p className="text-xs text-text-secondary">Track visitor logs, process check-ins, and search histories</p>
        </div>

        <div className="flex bg-white/5 border border-border p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "list" ? "bg-brand-indigo text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
          >
            Logs Registry
          </button>
          {(isGuard || isAdmin) && (
            <button
              onClick={() => setActiveTab("register")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${activeTab === "register" ? "bg-brand-indigo text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Registration</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab: LIST REGISTRY */}
      {activeTab === "list" && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl glass-panel-heavy">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by visitor name, phone, flat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo transition-colors"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="INSIDE">Inside</option>
                <option value="PENDING">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXITED">Exited</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
              >
                <option value="ALL">All Visitor Types</option>
                {VISITOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Registry Table */}
          <div className="p-6 rounded-2xl glass-panel-heavy overflow-hidden">
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted font-medium">
                      <th className="pb-3">Photo</th>
                      <th className="pb-3">Visitor Name</th>
                      <th className="pb-3">Contact</th>
                      <th className="pb-3">Flat Destination</th>
                      <th className="pb-3">Purpose</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-text-secondary">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="py-3.5">
                          <img
                            src={log.visitor.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                            alt={log.visitor.name}
                            className="w-8 h-8 rounded-full object-cover border border-border/40 bg-slate-800"
                          />
                        </td>
                        <td className="py-3.5 font-semibold text-text-primary flex flex-col justify-center">
                          <span>{log.visitor.name}</span>
                          {log.visitor.isBlacklisted && (
                            <span className="text-[9px] text-red-500 font-bold flex items-center mt-0.5">
                              <ShieldAlert className="w-3 h-3 mr-0.5" /> Blacklisted
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">{log.visitor.phone}</td>
                        <td className="py-3.5">Flat {log.flat.block.name}-{log.flat.number}</td>
                        <td className="py-3.5"><span className="px-2 py-0.5 rounded bg-white/5">{log.purpose}</span></td>
                        <td className="py-3.5">{log.visitorType}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                            ${log.status === "INSIDE" ? "bg-indigo-500/10 text-brand-indigo" : ""}
                            ${log.status === "EXITED" ? "bg-emerald-500/10 text-brand-emerald" : ""}
                            ${log.status === "PENDING" ? "bg-amber-500/10 text-amber-500 animate-pulse" : ""}
                            ${log.status === "REJECTED" ? "bg-red-500/10 text-red-500" : ""}
                          `}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          {log.status === "INSIDE" && isGuard && (
                            <button
                              onClick={() => handleCheckoutLog(log.id)}
                              className="px-2.5 py-1 rounded bg-brand-emerald hover:bg-emerald-500 text-white font-medium text-[10px] shadow-sm shadow-emerald-500/10"
                            >
                              Check-Out
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleToggleBlacklist(log.visitor.id, log.visitor.name, !log.visitor.isBlacklisted)}
                              className={`px-2 py-1 rounded font-medium text-[10px] border transition-colors
                                ${log.visitor.isBlacklisted 
                                  ? "border-emerald-500/20 text-brand-emerald hover:bg-emerald-500/10" 
                                  : "border-red-500/20 text-red-500 hover:bg-red-500/10"
                                }
                              `}
                            >
                              {log.visitor.isBlacklisted ? "Whitelist" : "Blacklist"}
                            </button>
                          )}
                          {(!isGuard && !isAdmin) && <span className="text-[10px] text-text-muted">None</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-text-muted">
                No logs matching filters found in Greenwood registry.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab: REGISTER NEW VISITOR */}
      {activeTab === "register" && (isGuard || isAdmin) && (
        <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* General credentials and camera capture */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel-heavy space-y-6">
            <h3 className="font-heading font-semibold text-sm text-text-primary">Visitor Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Amit Sharma"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 91111 22222"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amit@gmail.com"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Home Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Indiranagar, Bengaluru"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">ID Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Driver License">Driver License</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">ID Number</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="1234-5678-9012"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Visitor Type</label>
                  <select
                    value={visitorType}
                    onChange={(e) => setVisitorType(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
                  >
                    {VISITOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Staff Notes / Security Warnings</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarks about package weights or delivery gate rules..."
                className="w-full p-4 rounded-xl border border-border bg-white/5 text-sm focus:outline-none focus:border-brand-indigo transition-colors resize-none"
              />
            </div>
          </div>

          {/* Photo capture & flat details */}
          <div className="space-y-6">
            
            {/* Camera module */}
            <div className="p-6 rounded-2xl glass-panel-heavy text-center space-y-4 relative">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Camera Registration Photo</h3>
              
              {/* Photo viewport */}
              <div className="relative w-48 h-48 rounded-full border-2 border-border/80 mx-auto overflow-hidden bg-slate-900 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Captured preview" className="w-full h-full object-cover" />
                ) : cameraActive ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                ) : (
                  <Camera className="w-10 h-10 text-slate-500" />
                )}
              </div>

              {/* Camera actions */}
              <div className="flex items-center justify-center space-x-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-1.5 rounded-xl border border-border bg-white/5 hover:bg-white/10 text-text-primary text-xs font-semibold flex items-center space-x-1"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{photoUrl ? "Retake Photo" : "Open Camera"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-indigo hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Capture Snap</span>
                  </button>
                )}
              </div>
            </div>

            {/* Destination Selector */}
            <div className="p-6 rounded-2xl glass-panel-heavy space-y-4">
              <h3 className="font-heading font-semibold text-sm text-text-primary">Gate Mappings</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Flat Destination</label>
                  <select
                    required
                    value={flatId}
                    onChange={(e) => setFlatId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/15"
                  >
                    <option value="" disabled>Select Flat...</option>
                    {flatsList.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Purpose of Visit</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-white/5 text-xs text-text-primary focus:outline-none focus:border-brand-indigo appearance-none"
                  >
                    {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Vehicle Plate (If applicable)</label>
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="KA-51-AB-1234"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-white/5 text-xs focus:outline-none focus:border-brand-indigo uppercase transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Complete Gate Registry</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      )}

    </div>
  );
}
