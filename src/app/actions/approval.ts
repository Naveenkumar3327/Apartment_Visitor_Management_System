"use server";

import { apiFetch } from "@/lib/api";

export async function getPendingApprovals() {
  try {
    return await apiFetch("/visitors/approvals/pending");
  } catch (error: any) {
    console.error("Get pending approvals error:", error);
    return [];
  }
}

export async function resolveApproval(approvalId: string, status: "APPROVED" | "REJECTED", notes?: string) {
  try {
    return await apiFetch(`/visitors/approvals/${approvalId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    });
  } catch (error: any) {
    console.error("Resolve approval error:", error);
    return { error: error.message || "Failed to resolve visitor request." };
  }
}
