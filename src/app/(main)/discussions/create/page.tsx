import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import CreateThreadForm from "@/features/discussions/components/CreateThreadForm";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = { title: "Buat Diskusi · UniKai" };

export const dynamic = "force-dynamic";

export default async function CreateThreadPage() {
  const headerList = await headers();
  const session = await getSession(headerList);

  if (!session) {
    redirect("/login?redirect=/discussions/create");
  }

  return <CreateThreadForm />;
}
