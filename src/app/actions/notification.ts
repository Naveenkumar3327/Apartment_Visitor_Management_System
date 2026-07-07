"use server";

import { apiFetch } from "@/lib/api";

export async function getNotificationsList() {
  try {
    return await apiFetch("/notifications");
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    return await apiFetch(`/notifications/${id}/read`, {
      method: "PUT",
    });
  } catch (error: any) {
    console.error("Mark notification read error:", error);
    return { error: error.message || "Failed to update notification." };
  }
}

export async function clearAllNotifications() {
  try {
    return await apiFetch("/notifications", {
      method: "DELETE",
    });
  } catch (error: any) {
    console.error("Clear notifications error:", error);
    return { error: error.message || "Failed to clear notifications." };
  }
}
