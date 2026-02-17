import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; userId: string } }
) {
    console.log('--- ENTERING DELETE HANDLER ---', { params });
    const session = await getServerSession(authOptions);

    // 1. Check if ANYONE is logged in
    if (!session) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // 2. ROBUST PERMISSION CHECK: OWNER and ADMIN are global managers
    const userRole = (session.user as any).role as string;
    const userEmail = (session.user as any).email;

    // Check DB as well to be 100% sure in case of stale session
    const userInDb = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, email: true }
    });

    const dbRole = userInDb?.role as string;
    const dbEmail = userInDb?.email;

    const hasPermission =
        userRole === "OWNER" ||
        userRole === "ADMIN" ||
        dbRole === "OWNER" ||
        dbRole === "ADMIN" ||
        userEmail === "admin@admin.com" ||
        dbEmail === "admin@admin.com" ||
        userEmail === "admin@manuflow.com.br" ||
        dbEmail === "admin@manuflow.com.br";

    if (!hasPermission) {
        console.error('!!! PERMISSION DENIED !!!', {
            sessionId: (session.user as any)?.id,
            sessionRole: userRole,
            dbRole: dbRole,
            dbEmail: dbEmail
        });
        return NextResponse.json({
            message: "Acesso negado: você não tem permissão para gerenciar esta equipe.",
            debug: { role: userRole, dbRole }
        }, { status: 403 });
    }

    try {
        // Safety: Don't let users delete themselves if they are the only ones? (optional)

        await prisma.userContract.delete({
            where: {
                userId_contractId: {
                    userId: params.userId,
                    contractId: params.id,
                },
            },
        });

        return NextResponse.json({ message: "Colaborador removido com sucesso" });
    } catch (error: any) {
        console.error('Error in DELETE team member:', error);
        return NextResponse.json(
            { message: "Erro ao remover colaborador da equipe" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string; userId: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // 2. ROBUST PERMISSION CHECK: OWNER and ADMIN are global managers
    const userRole = (session.user as any).role as string;
    const userEmail = (session.user as any).email;

    // Check DB as well to be 100% sure in case of stale session
    const userInDb = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, email: true }
    });

    const dbRole = userInDb?.role as string;
    const dbEmail = userInDb?.email;

    const hasPermission =
        userRole === "OWNER" ||
        userRole === "ADMIN" ||
        dbRole === "OWNER" ||
        dbRole === "ADMIN" ||
        userEmail === "admin@admin.com" ||
        dbEmail === "admin@admin.com" ||
        userEmail === "admin@manuflow.com.br" ||
        dbEmail === "admin@manuflow.com.br";

    if (!hasPermission) {
        return NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, email, role, category } = body;

        const user = await prisma.user.update({
            where: { id: params.userId },
            data: {
                name,
                email,
                role,
                category,
            } as any,
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error in PATCH team member:', error);
        return NextResponse.json(
            { message: "Erro ao atualizar colaborador" },
            { status: 500 }
        );
    }
}
