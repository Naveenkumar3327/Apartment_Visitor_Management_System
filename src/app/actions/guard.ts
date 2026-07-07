"use server";

import { apiFetch } from "@/lib/api";

export async function getGuardsList() {
  try {
    const list = await apiFetch("/admin/guards");
    return list.map((item: any) => ({
      ...item,
      user: item.userId,
    }));
  } catch (error: any) {
    console.error("Get guards error:", error);
    return [];
  }
}

interface CreateGuardParams {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  shift: string;
  assignedGate: string;
  idCard: string;
}

export async function createGuard(params: CreateGuardParams) {
  try {
    return await apiFetch("/admin/guards", {
      method: "POST",
      body: JSON.stringify({
        name: params.name,
        email: params.email,
        phone: params.phone,
        shift: params.shift,
        assignedGate: params.assignedGate,
        idCard: params.idCard,
        password: params.passwordHash
      }),
    });
  } catch (error: any) {
    console.error("Create guard error:", error);
    return { error: error.message || "Failed to create guard profile." };
  }
}

export async function removeGuard(guardId: string) {
  try {
    return await apiFetch(`/admin/guards/${guardId}`, {
      method: "DELETE",
    });
  } catch (error: any) {
    console.error("Remove guard error:", error);
    return { error: error.message || "Failed to remove guard profile." };
  }
}
