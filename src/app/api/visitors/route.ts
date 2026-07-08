import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET() {
  try {
    const logs = await apiFetch("/visitors/logs");
    if (Array.isArray(logs)) {
      const mapped = logs.map((log: any) => {
        const flatObj = log.flat || log.flatId;
        const mappedFlat = flatObj ? {
          ...flatObj,
          block: flatObj.block || flatObj.blockId,
          floor: flatObj.floor || flatObj.floorId,
        } : null;

        return {
          ...log,
          visitor: log.visitor || log.visitorId,
          flat: mappedFlat,
          resident: log.resident || log.residentId,
        };
      });
      return NextResponse.json(mapped);
    }
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET visitor logs API proxy error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch visitor logs." }, { status: 500 });
  }
}
