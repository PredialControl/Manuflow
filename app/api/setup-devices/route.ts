import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota temporária de setup: cria medidor de GÁS e remove duplicados
// REMOVER APÓS USO
export async function GET() {
    const contractId = "cmm6md5930001lqpw6mtaak3s";
    const companyId  = "manuflow-default";

    // 1. Buscar todos os devices do contrato
    const all = await prisma.measurementDevice.findMany({
        where: { contractId },
        orderBy: { createdAt: "asc" },
    });

    // 2. Para cada tipo, manter só o mais antigo, desativar o restante
    const byType: Record<string, typeof all> = {};
    for (const d of all) {
        if (!byType[d.type]) byType[d.type] = [];
        byType[d.type].push(d);
    }

    const toDeactivate: string[] = [];
    for (const [type, devices] of Object.entries(byType)) {
        // keep first (oldest), deactivate rest
        const [keep, ...dups] = devices;
        toDeactivate.push(...dups.map(d => d.id));
    }

    if (toDeactivate.length > 0) {
        await prisma.measurementDevice.updateMany({
            where: { id: { in: toDeactivate } },
            data: { active: false },
        });
    }

    // 3. Criar GÁS se não existir
    const hasGas = all.some(d => d.type === "GAS");
    let gasDevice = null;
    if (!hasGas) {
        gasDevice = await prisma.measurementDevice.create({
            data: {
                contractId,
                companyId,
                name: "Medidor de Gás",
                type: "GAS",
                unit: "m³",
                serialNumber: "GAS-001",
            },
        });
    }

    return NextResponse.json({
        deactivated: toDeactivate.length,
        gasCreated: !hasGas,
        gasDevice: gasDevice?.id ?? "already existed",
        remaining: all.filter(d => !toDeactivate.includes(d.id)).map(d => `${d.type}: ${d.name}`),
    });
}
