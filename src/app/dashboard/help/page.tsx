import React from "react";
import { HelpCircle, ShieldCheck, QrCode, Phone, FileSpreadsheet } from "lucide-react";

export default function HelpCenterPage() {
  const sections = [
    {
      title: "Visitor Registration & Check-In",
      desc: "For Security Guards. Click 'New Registration' on the Visitors tab to register a guest manually. Select their destination Flat to instantly notify the Resident.",
      icon: ShieldCheck,
    },
    {
      title: "Scanning QR Pass Tickets",
      desc: "For Security Guards. Click 'Scan Pass' on the Dashboard or sidebar. Point the gate terminal camera at the visitor's ticket QR Code, or type the code (e.g., INV-88371) to check them in automatically.",
      icon: QrCode,
    },
    {
      title: "Crisis Alarms & Panic Buttons",
      desc: "For Residents and Guards. Open the 'Emergency' tab. Select Fire, Medical, or Police, add details, and click trigger. The gate house security and manager desk will be notified instantly via SMS and push sounds.",
      icon: Phone,
    },
    {
      title: "Generating Analytical Reports",
      desc: "For Admins. Access the 'Report Center'. Pick your starting and ending date ranges, apply flat or status filters, and click 'Compile'. Download the matching logs as a CSV file or print directly to PDF.",
      icon: FileSpreadsheet,
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">System Help Center</h2>
        <p className="text-xs text-text-secondary">Guides, instructions, and standard operating procedures for Greenwood Gate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="p-6 rounded-2xl glass-panel-heavy space-y-4">
              <div className="flex items-center space-x-2 text-brand-indigo font-bold text-sm">
                <Icon className="w-5 h-5" />
                <span>{section.title}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{section.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Support card */}
      <div className="p-6 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 text-xs text-slate-300 space-y-2">
        <h3 className="font-heading font-bold text-sm text-white flex items-center">
          <HelpCircle className="w-4 h-4 mr-1 text-indigo-400" /> Need Technical Support?
        </h3>
        <p>If you encounter hardware integration issues (e.g. camera permissions, barcode scanner connection errors), contact the Greenwood System Administrator at <strong>support@greenwoodgate.com</strong>.</p>
      </div>

    </div>
  );
}
