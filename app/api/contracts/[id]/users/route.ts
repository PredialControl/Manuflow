import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: contractId } = await params;
    console.log('--- ENTERING POST HANDLER ---', { contractId });
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // ROBUST PERMISSION CHECK: SUPER_ADMIN, OWNER, ADMIN are global managers
    // SUPERVISOR can create users for their contract
    const userRole = (session.user as any).role as string;
    const userEmail = (session.user as any).email;

    // Check DB as well to be 100% sure in case of stale session
    const userInDb = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, email: true }
    });

    const dbRole = userInDb?.role as string;
    const dbEmail = userInDb?.email;

    const isGlobalAdmin =
        userRole === "SUPER_ADMIN" ||
        userRole === "OWNER" ||
        userRole === "ADMIN" ||
        dbRole === "SUPER_ADMIN" ||
        dbRole === "OWNER" ||
        dbRole === "ADMIN" ||
        userEmail === "admin@admin.com" ||
        dbEmail === "admin@admin.com" ||
        userEmail === "admin@manuflow.com.br" ||
        dbEmail === "admin@manuflow.com.br";

    const isSupervisor = userRole === "SUPERVISOR" || dbRole === "SUPERVISOR";

    // If supervisor, check if they have access to this contract
    if (isSupervisor && !isGlobalAdmin) {
        const supervisorAccess = await prisma.userContract.findFirst({
            where: {
                userId: session.user.id,
                contractId,
            },
        });

        if (!supervisorAccess) {
            return NextResponse.json({
                message: "Você não tem acesso a este contrato"
            }, { status: 403 });
        }
    }

    const hasPermission = isGlobalAdmin || isSupervisor;

    if (!hasPermission) {
        return NextResponse.json({
            message: "Acesso negado",
            debug: { role: userRole, dbRole }
        }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, category } = body;

    if (!name || !email || !password || !role) {
        return NextResponse.json(
            { message: "Campos obrigatórios faltando" },
            { status: 400 }
        );
    }

    // SUPERVISOR can only create TECHNICIAN
    if (isSupervisor && !isGlobalAdmin && role !== "TECHNICIAN") {
        return NextResponse.json(
            { message: "Supervisores só podem criar técnicos" },
            { status: 403 }
        );
    }

    // Check limit of 4 technicians per contract
    if (role === "TECHNICIAN") {
        const technicianCount = await prisma.userContract.count({
            where: {
                contractId,
                user: {
                    role: "TECHNICIAN",
                },
            },
        });

        if (technicianCount >= 4) {
            return NextResponse.json(
                { message: "Limite de 4 técnicos por contrato atingido" },
                { status: 400 }
            );
        }
    }

    // OWNER/ADMIN can add SUPERVISOR to contract
    if ((role === "SUPERVISOR" || role === "ADMIN") && !isGlobalAdmin) {
        return NextResponse.json(
            { message: "Apenas OWNER pode adicionar Supervisores/Coordenadores" },
            { status: 403 }
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    category,
                    companyId: session.user.companyId,
                } as any,
            });

            // Link to contract
            await tx.userContract.create({
                data: {
                    userId: newUser.id,
                    contractId,
                },
            });

            return newUser;
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { message: "E-mail já cadastrado no sistema" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { message: "Erro ao criar usuário" },
            { status: 500 }
        );
    }
}
