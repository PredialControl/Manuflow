import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rondas/hoje — Rondas do dia para o técnico logado
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    // Hoje sem hora (meia-noite UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayMap: Record<number, string> = {
        0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT",
    };
    const todayDow = dayMap[new Date().getDay()];

    // Buscar agendamentos ativos para hoje
    const schedules = await prisma.inspectionSchedule.findMany({
        where: {
            active: true,
            days: { has: todayDow as any },
            ...(contractId ? { contractId } : {}),
            // Filtro por categoria do técnico
            ...(session.user.role === "TECHNICIAN"
                ? {
                    contract: { users: { some: { userId: session.user.id } } },
                    OR: [
                        { category: session.user.category }, // Rondas da especialidade dele
                        { category: "GERAL" },              // Ou rondas gerais
                        { category: null }                   // Ou sem categoria
                    ]
                }
                : {}),
        },
        include: {
            contract: { select: { id: true, name: true, logo: true } },
        },
    });

    // Para cada agendamento, verificar/criar a ocorrência de hoje
    const rondas = await Promise.all(
        schedules.map(async (schedule) => {
            // Verificar se já existe ocorrência para hoje
            let occurrence = await prisma.scheduledInspection.findFirst({
                where: {
                    scheduleId: schedule.id,
                    date: { gte: today, lt: tomorrow },
                },
                include: {
                    assignee: { select: { id: true, name: true } },
                    steps: true,
                },
            });

            // Se não existe, criar automaticamente
            if (!occurrence) {
                occurrence = await prisma.scheduledInspection.create({
                    data: {
                        companyId: session.user.companyId,
                        scheduleId: schedule.id,
                        contractId: schedule.contractId,
                        date: today,
                        // Se for técnico, auto-atribuir
                        ...(session.user.role === "TECHNICIAN"
                            ? { assignedTo: session.user.id }
                            : {}),
                        // Criar passos se existirem na agenda
                        steps: {
                            create: (schedule.steps as any[] || []).map((step: any) => ({
                                description: step.task,
                                assetId: step.assetId,
                                status: "PENDING",
                            })),
                        },
                    },
                    include: {
                        assignee: { select: { id: true, name: true } },
                        steps: {
                            include: { asset: { select: { name: true } } }
                        },
                    },
                });
            }

            return {
                ...occurrence,
                schedule: {
                    id: schedule.id,
                    name: schedule.name,
                    shift: schedule.shift,
                    time: schedule.time,
                    days: schedule.days,
                },
                contract: schedule.contract,
            };
        })
    );

    return NextResponse.json(rondas);
}
