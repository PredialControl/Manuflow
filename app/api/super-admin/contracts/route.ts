import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const contracts = await prisma.contract.findMany({
    where: {
      active: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      company: true,
      paymentStatus: true,
      paymentDueDate: true,
      monthlyValue: true,
      createdAt: true,
      companyOwner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { paymentStatus: "asc" },
      { paymentDueDate: "asc" },
    ],
  });

  return NextResponse.json(contracts);
}
