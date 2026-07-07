"use server";

import { apiFetch } from "@/lib/api";

export async function getResidentsList() {
  try {
    const list = await apiFetch("/admin/residents");
    return list.map((item: any) => ({
      ...item,
      user: item.userId,
      flat: item.flatId,
    }));
  } catch (error: any) {
    console.error("Get residents error:", error);
    return [];
  }
}

export async function toggleResidentStatus(residentId: string, status: "ACTIVE" | "INACTIVE") {
  try {
    return await apiFetch(`/admin/residents/${residentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  } catch (error: any) {
    console.error("Toggle resident status error:", error);
    return { error: error.message || "Failed to update resident status." };
  }
}

export async function removeResident(residentId: string) {
  try {
    return await apiFetch(`/admin/residents/${residentId}`, {
      method: "DELETE",
    });
  } catch (error: any) {
    console.error("Remove resident error:", error);
    return { error: error.message || "Failed to remove resident." };
  }
}
