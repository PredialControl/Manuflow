-- CreateEnum
CREATE TYPE "RelevantItemStatus" AS ENUM ('AWAITING_BUDGET', 'AWAITING_APPROVAL', 'APPROVED', 'COMPLETED');

-- CreateTable
CREATE TABLE "RelevantItem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RelevantItemStatus" NOT NULL DEFAULT 'AWAITING_BUDGET',
    "priority" TEXT,
    "dueDate" TIMESTAMP(3),
    "value" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RelevantItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelevantItemAttachment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelevantItemAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RelevantItem" ADD CONSTRAINT "RelevantItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevantItem" ADD CONSTRAINT "RelevantItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevantItemAttachment" ADD CONSTRAINT "RelevantItemAttachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RelevantItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevantItemAttachment" ADD CONSTRAINT "RelevantItemAttachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
