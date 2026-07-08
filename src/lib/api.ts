import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000"}/api`;

export async function getAuthToken() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.accessToken || "";
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  } as Record<string, string>;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}
