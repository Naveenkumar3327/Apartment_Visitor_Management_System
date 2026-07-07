"use server";

import { apiFetch } from "@/lib/api";

export async function getDashboardData() {
  try {
    return await apiFetch("/dashboard/stats");
  } catch (error: any) {
    console.error("Dashboard Server Action error:", error);
    return { error: error.message || "Failed to load dashboard metrics." };
  }
}
