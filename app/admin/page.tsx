import type { Metadata } from "next";

import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage products, orders, inventory, media, customers, and visitor insights for AahaFood.",
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminApp />;
}
