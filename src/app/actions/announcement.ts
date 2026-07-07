"use server";

import { apiFetch } from "@/lib/api";

interface AnnouncementParams {
  title: string;
  content: string;
  type: string; // "NOTICE", "MAINTENANCE", "FESTIVAL", "EMERGENCY"
}

export async function getAnnouncements() {
  try {
    return await apiFetch("/notifications/announcements");
  } catch (error: any) {
    console.error("Get announcements error:", error);
    return [];
  }
}

export async function createAnnouncement(params: AnnouncementParams) {
  try {
    return await apiFetch("/notifications/announcements", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch (error: any) {
    console.error("Announcement error:", error);
    return { error: error.message || "Failed to post announcement." };
  }
}
