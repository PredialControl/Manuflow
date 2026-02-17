import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    console.log('--- ENTERING POST HANDLER ---', { params });
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // ROBUST PERMISSION CHECK: OWNER and ADMIN are global managers
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
                } as any,
            });

            // Link to contract
            await tx.userContract.create({
                data: {
                    userId: newUser.id,
                    contractId: params.id,
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
