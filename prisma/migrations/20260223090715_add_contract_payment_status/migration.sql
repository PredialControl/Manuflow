-- CreateEnum
CREATE TYPE "ContractPaymentStatus" AS ENUM ('EM_DIA', 'VENCIDO', 'SUSPENSO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "monthlyValue" DOUBLE PRECISION,
ADD COLUMN     "paymentDueDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "ContractPaymentStatus" NOT NULL DEFAULT 'EM_DIA';

-- CreateIndex
CREATE INDEX "Contract_companyId_paymentStatus_idx" ON "Contract"("companyId", "paymentStatus");
