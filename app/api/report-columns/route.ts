import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Buscar colunas da empresa
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const companyId = session.user.companyId;

        const columns = await prisma.reportColumn.findMany({
            where: { companyId },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(columns);
    } catch (error) {
        console.error("Error fetching report columns:", error);
        return NextResponse.json(
            { error: "Failed to fetch columns" },
            { status: 500 }
        );
    }
}

// POST - Criar nova coluna customizada
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Apenas OWNER e ADMIN podem criar colunas
        const userRole = session.user.role;
        if (userRole !== "OWNER" && userRole !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden - Only OWNER/ADMIN can create columns" },
                { status: 403 }
            );
        }

        const companyId = session.user.companyId;
        const body = await request.json();
        const { title, color, bgColor } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        // Gerar statusKey a partir do título
        const statusKey = title
            .toUpperCase()
            .replace(/\s+/g, "_")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

        // Buscar a maior ordem atual
        const lastColumn = await prisma.reportColumn.findFirst({
            where: { companyId },
            orderBy: { order: "desc" },
        });

        const nextOrder = lastColumn ? lastColumn.order + 1 : 1;

        const newColumn = await prisma.reportColumn.create({
            data: {
                companyId,
                title,
                statusKey,
                color: color || "text-blue-600 dark:text-blue-400",
                bgColor: bgColor || "bg-blue-500/10",
                order: nextOrder,
                isDefault: false,
            },
        });

        return NextResponse.json(newColumn, { status: 201 });
    } catch (error: any) {
        console.error("Error creating report column:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A column with this name already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create column" },
            { status: 500 }
        );
    }
}
