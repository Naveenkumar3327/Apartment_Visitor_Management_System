import React from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Greenwood Gate Manager",
};

export default async function DashboardPage() {
  const initialData = await getDashboardData();
  return <DashboardClient initialData={initialData} />;
}
