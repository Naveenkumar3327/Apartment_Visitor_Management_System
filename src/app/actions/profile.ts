"use server";

import { apiFetch } from "@/lib/api";

export async function getProfileData() {
  try {
    const data = await apiFetch("/auth/profile");
    if (!data) return null;

    // Map Mongoose references (flatId -> flat, apartmentId -> apartment) for frontend compatibility
    if (data.resident) {
      data.resident.flat = data.resident.flatId;
    }
    if (data.guard) {
      data.guard.apartment = data.guard.apartmentId;
    }

    return data;
  } catch (error) {
    console.error("Profile retrieval error:", error);
    return null;
  }
}

export async function updateProfileData(name: string, email: string, phone?: string) {
  try {
    return await apiFetch("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ name, email, phone }),
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { error: error.message || "Failed to update profile settings." };
  }
}
