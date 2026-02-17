import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExpirationAlert } from "@/services/email";
import { addDays, subDays, isBefore, isAfter } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in60Days = addDays(now, 60);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const expiringIn60 = await prisma.report.findMany({
    where: {
      expirationDate: {
        gte: in60Days,
      },
      deletedAt: null,
      status: { not: "RENEWED" },
    },
    include: {
      contract: true,
    },
  });

  const expiringSoon = await prisma.report.findMany({
    where: {
      expirationDate: {
        gte: today,
        lte: in60Days,
      },
      deletedAt: null,
      status: { not: "RENEWED" },
    },
    include: {
      contract: true,
    },
  });

  const expired = await prisma.report.findMany({
    where: {
      expirationDate: {
        lt: today,
      },
      deletedAt: null,
      status: { notIn: ["RENEWED", "EXPIRED"] },
    },
    include: {
      contract: true,
    },
  });

  const emailsSent = { alert60: 0, expired: 0 };
  const maxEmails = 100;
  let emailCount = 0;

  for (const report of expiringSoon) {
    if (emailCount >= maxEmails) break;

    const existingAlert = await prisma.emailQueue.findFirst({
      where: {
        reportId: report.id,
        type: "ALERT_60",
        status: "SENT",
        createdAt: {
          gte: subDays(now, 30),
        },
      },
    });

    if (existingAlert) continue;

    const daysUntil = Math.ceil(
      (new Date(report.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const result = await sendExpirationAlert({
      to: report.contract.email,
      contractName: report.contract.name,
      reportTitle: report.title,
      expirationDate: format(new Date(report.expirationDate), "dd/MM/yyyy", { locale: ptBR }),
      daysUntilExpiration: daysUntil,
    });

    if (result.success) {
      emailCount++;
      emailsSent.alert60++;

      await prisma.emailQueue.create({
        data: {
          contractId: report.contractId,
          reportId: report.id,
          type: "ALERT_60",
          status: "SENT",
          sentAt: now,
        },
      });
    } else {
      await prisma.emailQueue.create({
        data: {
          contractId: report.contractId,
          reportId: report.id,
          type: "ALERT_60",
          status: "FAILED",
          errorMessage: JSON.stringify(result.error),
        },
      });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  for (const report of expired) {
    if (emailCount >= maxEmails) break;

    const existingAlert = await prisma.emailQueue.findFirst({
      where: {
        reportId: report.id,
        type: "EXPIRED",
        status: "SENT",
        createdAt: {
          gte: subDays(now, 7),
        },
      },
    });

    if (existingAlert) continue;

    const result = await sendExpirationAlert({
      to: report.contract.email,
      contractName: report.contract.name,
      reportTitle: report.title,
      expirationDate: format(new Date(report.expirationDate), "dd/MM/yyyy", { locale: ptBR }),
    });

    if (result.success) {
      emailCount++;
      emailsSent.expired++;

      await prisma.report.update({
        where: { id: report.id },
        data: { status: "EXPIRED" },
      });

      await prisma.emailQueue.create({
        data: {
          contractId: report.contractId,
          reportId: report.id,
          type: "EXPIRED",
          status: "SENT",
          sentAt: now,
        },
      });
    } else {
      await prisma.emailQueue.create({
        data: {
          contractId: report.contractId,
          reportId: report.id,
          type: "EXPIRED",
          status: "FAILED",
          errorMessage: JSON.stringify(result.error),
        },
      });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return NextResponse.json({
    success: true,
    processed: {
      expiringIn60Days: expiringIn60.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
    },
    emailsSent,
    totalEmails: emailCount,
  });
}
