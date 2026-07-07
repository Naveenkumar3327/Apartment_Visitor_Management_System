"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileSpreadsheet, Printer, Download, Search, Calendar, Filter } from "lucide-react";
import { generateReportData, getReportFilterMetadata } from "@/app/actions/report";
import toast from "react-hot-toast";

export default function ReportsCenterPage() {
  const { data: session } = useSession();

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flatId, setFlatId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [visitorType, setVisitorType] = useState("ALL");
  const [purpose, setPurpose] = useState("ALL");

  // Roster listing metadata
  const [flats, setFlats] = useState<any[]>([]);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFilterMetadata();
  }, []);

  const loadFilterMetadata = async () => {
    try {
      const meta = await getReportFilterMetadata();
      if (meta && "flats" in meta) {
        setFlats(meta.flats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!session || !["SUPER_ADMIN", "APARTMENT_ADMIN"].includes(session.user.role)) {
    return (
      <div className="p-6 text-center text-xs text-text-muted glass-panel rounded-2xl">
        Access restricted. Administrator privileges required.
      </div>
    );
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Compiling report records...");
    
    try {
      const data = await generateReportData({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        flatId,
        status,
        visitorType,
        purpose,
      });

      if ("error" in data) {
        toast.error(data.error, { id: toastId });
      } else {
        setReportRows(data);
        toast.success(`Success! Compiled ${data.length} records.`, { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to compile logs.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (reportRows.length === 0) {
      toast.error("No report data available to export.");
      return;
    }

    const headers = ["Visitor Name", "Phone", "Type", "Flat Destination", "Purpose", "Vehicle Plate", "Check-in Time", "Check-out Time", "Status", "Date"];
    const rows = reportRows.map(row => [
      `"${row.visitorName}"`,
      `"${row.visitorPhone}"`,
      `"${row.visitorType}"`,
      `"${row.flat}"`,
      `"${row.purpose}"`,
      `"${row.vehicle}"`,
      `"${row.arrival}"`,
      `"${row.exit}"`,
      `"${row.status}"`,
      `"${row.date}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Greenwood_Gate_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report download started!");
  };

  // Browser Print trigger
  const handlePrint = () => {
    if (reportRows.length === 0) {
      toast.error("No report data available to print.");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Society Report Center</h2>
          <p className="text-xs text-text-secondary">Extract, filter, and audit visitor registers database logs</p>
        </div>
      </div>

      {/* Filter panel */}
      <form onSubmit={handleGenerate} className="p-6 rounded-2xl glass-panel-heavy space-y-4 no-print">
        <h3 className="font-heading font-semibold text-sm text-text-primary">Extraction Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1.5">Flat Number</label>
            <select
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs focus:outline-none"
            >
              <option value="ALL">All Flats</option>
              {flats.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1.5">Visitor Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="INSIDE">Inside</option>
              <option value="EXITED">Exited</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1.5">Visitor Type</label>
            <select
              value={visitorType}
              onChange={(e) => setVisitorType(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="Guest">Guest</option>
              <option value="Delivery">Delivery</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Domestic Help">Domestic Help</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1.5">Purpose of Entry</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-white/5 text-xs focus:outline-none"
            >
              <option value="ALL">All Purposes</option>
              <option value="GUEST">Guest</option>
              <option value="DELIVERY">Delivery</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="COURIER">Courier</option>
              <option value="CAB">Cab</option>
              <option value="FOOD">Food Delivery</option>
              <option value="DOMESTIC_HELP">Domestic Help</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-brand-indigo hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Compile Report</span>
            </>
          )}
        </button>
      </form>

      {/* Reports output sheet */}
      {reportRows.length > 0 ? (
        <div className="p-6 rounded-2xl glass-panel-heavy space-y-4 print:p-0 print:border-none print:shadow-none">
          <div className="flex items-center justify-between border-b border-border/50 pb-4 print:border-slate-300">
            <div>
              <h3 className="font-heading font-semibold text-sm text-text-primary print:text-black">Compiled Register Entries</h3>
              <span className="text-[10px] text-text-muted print:text-slate-500">Record count: {reportRows.length} matches</span>
            </div>
            
            <div className="flex items-center space-x-2 no-print">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl border border-border hover:bg-white/5 text-text-primary text-xs font-semibold flex items-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-semibold flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs print:text-slate-900">
              <thead>
                <tr className="border-b border-border text-text-muted font-medium print:text-slate-600 print:border-slate-300">
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Flat</th>
                  <th className="pb-3">Purpose</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Check-In</th>
                  <th className="pb-3">Check-Out</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text-secondary print:divide-slate-200">
                {reportRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 font-semibold text-text-primary print:text-black">{row.visitorName}</td>
                    <td className="py-3">{row.visitorType}</td>
                    <td className="py-3 font-medium">{row.flat}</td>
                    <td className="py-3">{row.purpose}</td>
                    <td className="py-3 font-mono">{row.vehicle}</td>
                    <td className="py-3 text-[10px]">{row.arrival}</td>
                    <td className="py-3 text-[10px]">{row.exit}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase print:bg-none print:p-0
                        ${row.status === "INSIDE" ? "bg-indigo-500/10 text-brand-indigo print:text-indigo-800" : ""}
                        ${row.status === "EXITED" ? "bg-emerald-500/10 text-brand-emerald print:text-green-800" : ""}
                        ${row.status === "PENDING" ? "bg-amber-500/10 text-amber-500 print:text-amber-800" : ""}
                        ${row.status === "REJECTED" ? "bg-red-500/10 text-red-500 print:text-red-800" : ""}
                      `}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-text-muted glass-panel rounded-2xl flex flex-col items-center justify-center space-y-3 no-print">
          <FileSpreadsheet className="w-12 h-12 text-indigo-500/25" />
          <span>Configure extraction filters and run "Compile Report" to display database rows here.</span>
        </div>
      )}

      {/* Print-specific layout helper styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          header, aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
