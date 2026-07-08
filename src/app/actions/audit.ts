"use server";

import { apiFetch } from "@/lib/api";

interface GetLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  deviceType?: string;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
}

/**
 * Fetches paginated and filtered activity/audit logs from the server.
 */
export async function getActivityLogsList(params: GetLogsParams = {}) {
  try {
    const queryParts: string[] = [];
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.role) queryParts.push(`role=${params.role}`);
    if (params.deviceType) queryParts.push(`deviceType=${params.deviceType}`);
    if (params.status) queryParts.push(`status=${params.status}`);
    if (params.dateStart) queryParts.push(`dateStart=${params.dateStart}`);
    if (params.dateEnd) queryParts.push(`dateEnd=${params.dateEnd}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    const data = await apiFetch(`/admin/activity-logs${queryString}`);
    
    return {
      logs: (data.logs || []).map((item: any) => ({
        ...item,
        user: item.userId,
      })),
      total: data.total || 0,
      pages: data.pages || 1,
      currentPage: data.currentPage || 1,
    };
  } catch (error: any) {
    console.error("Get activity logs error:", error);
    return { logs: [], total: 0, pages: 1, currentPage: 1 };
  }
}

/**
 * Super Admin function to archive logs older than a specific amount of days.
 */
export async function archiveActivityLogs(days: number) {
  try {
    return await apiFetch("/admin/activity-logs/archive", {
      method: "POST",
      body: JSON.stringify({ days })
    });
  } catch (error: any) {
    console.error("Archive logs error:", error);
    throw error;
  }
}

/**
 * Super Admin function to manually trigger a database backup.
 */
export async function triggerManualBackup() {
  try {
    return await apiFetch("/admin/backup", {
      method: "POST"
    });
  } catch (error: any) {
    console.error("Manual backup error:", error);
    throw error;
  }
}
