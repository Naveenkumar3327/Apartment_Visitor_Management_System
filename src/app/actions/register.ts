"use server";

import { apiFetch } from "@/lib/api";

interface RegisterParams {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  blockName: string;
  flatNumber: string;
  isOwner: boolean;
}

export async function registerResident(params: RegisterParams) {
  try {
    return await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch (error: any) {
    console.error("Registration action error:", error);
    return { error: error.message || "An unexpected error occurred during registration." };
  }
}
