"use server";

import { apiFetch } from "@/lib/api";

export async function getActivityLogsList() {
  try {
    const list = await apiFetch("/admin/activity-logs");
    return list.map((item: any) => ({
      ...item,
      user: item.userId,
    }));
  } catch (error: any) {
    console.error("Get activity logs error:", error);
    return [];
  }
}
