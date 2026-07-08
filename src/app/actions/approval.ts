"use server";

import { apiFetch } from "@/lib/api";

export async function getPendingApprovals() {
  try {
    const list = await apiFetch("/visitors/approvals/pending");
    if (Array.isArray(list)) {
      return list.map((item: any) => {
        // Build nested visitor mappings inside log if populated
        const logObj = item.logId ? (() => {
          const flatObj = item.logId.flat || item.logId.flatId;
          const mappedFlat = flatObj ? {
            ...flatObj,
            block: flatObj.block || flatObj.blockId,
            floor: flatObj.floor || flatObj.floorId,
          } : null;
          return {
            ...item.logId,
            visitor: item.logId.visitor || item.logId.visitorId,
            flat: mappedFlat,
            resident: item.logId.resident || item.logId.residentId,
          };
        })() : null;

        return {
          ...item,
          log: logObj,
          resident: item.resident || item.residentId,
        };
      });
    }
    return list;
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
