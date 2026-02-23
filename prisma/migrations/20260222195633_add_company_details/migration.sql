-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "contractDate" TIMESTAMP(3),
ADD COLUMN     "responsibleEmail" TEXT;
