import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const contract = await prisma.contract.findFirst({
        where: {
            id,
            active: true,
            deletedAt: null,
            users: session.user.role === "ADMIN"
                ? {}
                : { some: { userId: session.user.id } },
        },
    });

    if (!contract) {
        return NextResponse.json({ message: "Contrato não encontrado" }, { status: 404 });
    }

    return NextResponse.json(contract);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { name, company, responsible, email, phone, logo } = body;

        const contract = await prisma.contract.update({
            where: { id },
            data: {
                name,
                company,
                responsible,
                email,
                phone,
                logo,
            },
        });

        return NextResponse.json(contract);
    } catch (error) {
        return NextResponse.json(
            { message: "Erro ao atualizar contrato" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.contract.update({
            where: { id },
            data: {
                active: false,
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({ message: "Contrato removido com sucesso" });
    } catch (error) {
        return NextResponse.json(
            { message: "Erro ao remover contrato" },
            { status: 500 }
        );
    }
}
