import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { steps } = body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { message: "Steps are required" },
        { status: 400 }
      );
    }

    // Find the inspection via the first step ID
    const firstStep = await (prisma as any).inspectionStep.findUnique({
      where: { id: steps[0].id },
      select: { inspectionId: true },
    });

    if (!firstStep) {
      return NextResponse.json(
        { message: "Inspection not found" },
        { status: 404 }
      );
    }

    const inspectionId = firstStep.inspectionId;

    // Update all steps
    await Promise.all(
      steps.map((step: any) =>
        (prisma as any).inspectionStep.update({
          where: { id: step.id },
          data: {
            status: step.status || "OK",
            photoUrl: step.photoUrl || null,
            notes: step.notes || null,
          },
        })
      )
    );

    // Mark inspection as COMPLETED
    await (prisma as any).inspection.update({
      where: { id: inspectionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, inspectionId });
  } catch (error: any) {
    console.error("Error completing inspection:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
