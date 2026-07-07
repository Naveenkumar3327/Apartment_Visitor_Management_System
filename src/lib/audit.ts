import { db } from "./db";

interface AuditLogParams {
  userId?: string | null;
  action: string;
  details: string;
  ipAddress?: string;
}

export async function logActivity({ userId, action, details, ipAddress = "127.0.0.1" }: AuditLogParams) {
  try {
    const log = await db.activityLog.create({
      data: {
        userId: userId || null,
        action,
        details,
        ipAddress,
      },
    });
    return log;
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}
