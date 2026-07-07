"use server";

import { apiFetch } from "@/lib/api";

export async function getSystemSettings() {
  try {
    return await apiFetch("/admin/settings");
  } catch (error: any) {
    console.error("Get system settings error:", error);
    return null;
  }
}

interface UpdateSettingsParams {
  workingHours: string;
  visitorTimeLimit: number;
  qrExpiry: number;
  notificationSettings: string;
  theme: string;
}

export async function updateSystemSettings(params: UpdateSettingsParams) {
  try {
    return await apiFetch("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(params),
    });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return { error: error.message || "Failed to save system settings." };
  }
}
