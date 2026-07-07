"use server";

import { apiFetch } from "@/lib/api";

interface CheckInParams {
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  address?: string;
  idType: string;
  idNumber: string;
  purpose: string;
  vehicleNumber?: string;
  flatId: string;
  visitorType: string;
  notes?: string;
  photoUrl?: string;
}

export async function registerAndCheckIn(params: CheckInParams) {
  try {
    return await apiFetch("/visitors/checkin", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return { error: error.message || "Failed to register check-in request." };
  }
}

export async function checkOutVisitor(logId: string) {
  try {
    return await apiFetch(`/visitors/checkout/${logId}`, {
      method: "POST",
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    return { error: error.message || "Failed to complete check-out." };
  }
}

export async function toggleVisitorBlacklist(visitorId: string, isBlacklisted: boolean, notes?: string) {
  try {
    return await apiFetch(`/visitors/${visitorId}/blacklist`, {
      method: "PUT",
      body: JSON.stringify({ isBlacklisted, notes }),
    });
  } catch (error: any) {
    console.error("Blacklist toggle error:", error);
    return { error: error.message || "Failed to update blacklist status." };
  }
}
