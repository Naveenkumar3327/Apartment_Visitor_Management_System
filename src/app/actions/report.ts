"use server";

import { apiFetch } from "@/lib/api";

interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  flatId?: string;
  status?: string;
  visitorType?: string;
  purpose?: string;
}

export async function generateReportData(filters: ReportFilterParams) {
  try {
    return await apiFetch("/admin/reports/generate", {
      method: "POST",
      body: JSON.stringify(filters),
    });
  } catch (error: any) {
    console.error("Report generation error:", error);
    return { error: error.message || "Failed to generate report details." };
  }
}

export async function getReportFilterMetadata() {
  try {
    const data = await apiFetch("/admin/reports/metadata");
    if (!data || !data.flats) {
      return { flats: [] };
    }

    const flatOptions = data.flats.map((f: any) => ({
      id: f.id,
      label: `${f.blockId?.name || "Block"} - Flat ${f.number}`,
    }));

    return {
      flats: flatOptions,
    };
  } catch (error) {
    console.error("Error loading filter metadata:", error);
    return { flats: [] };
  }
}
