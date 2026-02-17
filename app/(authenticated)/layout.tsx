import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SidebarProvider } from "@/components/sidebar-context";
import { AuthenticatedLayoutClient } from "@/components/authenticated-layout-client";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AuthenticatedLayoutClient session={session}>
        {children}
      </AuthenticatedLayoutClient>
    </SidebarProvider>
  );
}
