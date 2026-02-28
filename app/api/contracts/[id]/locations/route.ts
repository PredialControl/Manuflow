import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Buscar todas as localizações do contrato organizadas hierarquicamente
        const buildings = await prisma.building.findMany({
            where: {
                contractId: id,
                companyId: session.user.companyId,
                active: true,
            },
            include: {
                floors: {
                    where: { active: true },
                    include: {
                        locations: {
                            where: { active: true },
                            orderBy: { name: "asc" },
                        },
                    },
                    orderBy: { number: "desc" },
                },
            },
            orderBy: { name: "asc" },
        });

        // Formatar para um array simples de opções de localização
        const locationOptions = buildings.flatMap(building =>
            building.floors.flatMap(floor =>
                floor.locations.map(location => ({
                    id: location.id,
                    label: `${building.name} - ${floor.number}º Andar - ${location.name}`,
                    buildingName: building.name,
                    floorNumber: floor.number,
                    locationName: location.name,
                }))
            )
        );

        return NextResponse.json(locationOptions);
    } catch (error) {
        console.error("Error fetching locations:", error);
        return NextResponse.json(
            { error: "Failed to fetch locations" },
            { status: 500 }
        );
    }
}
