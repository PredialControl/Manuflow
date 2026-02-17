import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EditContractUserForm } from "./edit-form";

export default async function EditContractUserPage({
    params,
}: {
    params: { id: string; userId: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Check permissions
    const isOwner = session.user.role === "OWNER";
    const userContractLink = await prisma.userContract.findUnique({
        where: {
            userId_contractId: {
                userId: session.user.id,
                contractId: params.id,
            },
        },
    });

    const isContractAdmin = session.user.role === "ADMIN" && !!userContractLink;

    if (!isOwner && !isContractAdmin) {
        redirect(`/contracts/${params.id}`);
    }

    const user = await prisma.user.findUnique({
        where: { id: params.userId },
    });

    if (!user) {
        redirect(`/contracts/${params.id}?tab=team`);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <EditContractUserForm
                contractId={params.id}
                user={user as any}
            />
        </div>
    );
}
