"use server";

import { apiFetch } from "@/lib/api";

export async function getDashboardData() {
  try {
    const data = await apiFetch("/dashboard/stats");
    if (data) {
      if (Array.isArray(data.recentLogs)) {
        data.recentLogs = data.recentLogs.map((log: any) => {
          const flatObj = log.flat || log.flatId;
          const mappedFlat = flatObj ? {
            ...flatObj,
            block: flatObj.block || flatObj.blockId,
            floor: flatObj.floor || flatObj.floorId,
          } : null;

          return {
            ...log,
            visitor: log.visitor || log.visitorId,
            flat: mappedFlat,
            resident: log.resident || log.residentId,
          };
        });
      }
      if (Array.isArray(data.visitorLogs)) {
        data.visitorLogs = data.visitorLogs.map((log: any) => {
          const flatObj = log.flat || log.flatId;
          const mappedFlat = flatObj ? {
            ...flatObj,
            block: flatObj.block || flatObj.blockId,
            floor: flatObj.floor || flatObj.floorId,
          } : null;

          return {
            ...log,
            visitor: log.visitor || log.visitorId,
            flat: mappedFlat,
            resident: log.resident || log.residentId,
          };
        });
      }
    }
    return data;
  } catch (error: any) {
    if (error.digest === "DYNAMIC_SERVER_USAGE" || error.message?.includes("Dynamic server usage")) {
      throw error;
    }
    console.error("Dashboard Server Action error:", error);
    return { error: error.message || "Failed to load dashboard metrics." };
  }
}
