import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET() {
  try {
    const logs = await apiFetch("/visitors/logs");
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET visitor logs API proxy error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch visitor logs." }, { status: 500 });
  }
}
