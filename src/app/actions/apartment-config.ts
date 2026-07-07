"use server";

import { apiFetch } from "@/lib/api";

export async function getApartmentConfig() {
  try {
    return await apiFetch("/admin/apartment-config");
  } catch (error: any) {
    console.error("Get apartment config error:", error);
    return null;
  }
}

export async function updateApartmentConfig(id: string, name: string, address: string, emergencyContactsJson: string) {
  try {
    return await apiFetch("/admin/apartment-config", {
      method: "PUT",
      body: JSON.stringify({
        name,
        address,
        emergencyContacts: emergencyContactsJson
      }),
    });
  } catch (error: any) {
    console.error("Update apartment config error:", error);
    return { error: error.message || "Failed to update configuration." };
  }
}
