"use server";

import { apiFetch } from "@/lib/api";

interface CreatePassParams {
  visitorName: string;
  visitorPhone: string;
  visitorType: string;
  expiryHours: number;
}

export async function createPreBookedPass(params: CreatePassParams) {
  try {
    const data = await apiFetch("/visitors/passes", {
      method: "POST",
      body: JSON.stringify(params),
    });

    if (data.error) {
      return { error: data.error };
    }

    return {
      success: true,
      message: "Pass generated successfully!",
      pass: {
        id: data.id,
        code: data.code,
        visitorName: data.visitorName,
        expiryTime: new Date(data.expiryTime),
        flatNumber: data.flatId?.number || "N/A",
      }
    };
  } catch (error: any) {
    console.error("Pass generation error:", error);
    return { error: error.message || "Failed to generate pass." };
  }
}

export async function scanAndVerifyPass(code: string) {
  try {
    return await apiFetch("/visitors/passes/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  } catch (error: any) {
    console.error("Scan validation error:", error);
    return { error: error.message || "Failed to scan and verify QR pass." };
  }
}
