"use server";

import { apiFetch } from "@/lib/api";

export async function triggerEmergencyAlert(type: "FIRE" | "MEDICAL" | "POLICE" | "PANIC", notes?: string) {
  try {
    return await apiFetch("/emergency", {
      method: "POST",
      body: JSON.stringify({ type, notes }),
    });
  } catch (error: any) {
    console.error("Emergency trigger error:", error);
    return { error: error.message || "Failed to trigger emergency alert." };
  }
}

export async function getActiveEmergencies() {
  try {
    const list = await apiFetch("/emergency/active");
    return list.map((item: any) => ({
      ...item,
      triggeredBy: item.triggeredById,
    }));
  } catch (error: any) {
    console.error("Get active emergencies error:", error);
    return [];
  }
}

export async function resolveEmergencyAlert(alertId: string, notes?: string) {
  try {
    return await apiFetch(`/emergency/resolve/${alertId}`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  } catch (error: any) {
    console.error("Emergency resolve error:", error);
    return { error: error.message || "Failed to resolve alert." };
  }
}
