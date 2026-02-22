-- ============================================
-- MIGRATION: Multi-Tenancy Implementation
-- Safe migration strategy: nullable → populate → NOT NULL → FK
-- ============================================

-- Step 1: Create Enums
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED');
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- Step 2: Create Company Table
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "expirationDate" TIMESTAMP(3),
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Step 3: Insert Default Company
INSERT INTO "Company" ("id", "name", "subscriptionStatus", "createdAt", "updatedAt")
VALUES ('manuflow-default', 'ManuFlow', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- Step 4: Add companyId columns (NULLABLE)
-- ============================================

ALTER TABLE "User" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Asset" ADD COLUMN "companyId" TEXT;
ALTER TABLE "AssetScript" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Inspection" ADD COLUMN "companyId" TEXT;
ALTER TABLE "InspectionStep" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Report" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ReportTemplate" ADD COLUMN "companyId" TEXT; -- Stays nullable
ALTER TABLE "ReportVersion" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Photo" ADD COLUMN "companyId" TEXT;
ALTER TABLE "EmailQueue" ADD COLUMN "companyId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "companyId" TEXT;
ALTER TABLE "InspectionSchedule" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ScheduledInspection" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ScheduledInspectionStep" ADD COLUMN "companyId" TEXT;
ALTER TABLE "MeasurementDevice" ADD COLUMN "companyId" TEXT;
ALTER TABLE "MeasurementEntry" ADD COLUMN "companyId" TEXT;
ALTER TABLE "RelevantItem" ADD COLUMN "companyId" TEXT;
ALTER TABLE "RelevantItemAttachment" ADD COLUMN "companyId" TEXT;

-- ============================================
-- Step 5: Populate companyId with default company
-- ============================================

-- User: all users go to default company
UPDATE "User" SET "companyId" = 'manuflow-default';

-- Contract: all contracts go to default company
UPDATE "Contract" SET "companyId" = 'manuflow-default';

-- Asset: inherit from contract (safer)
UPDATE "Asset"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "Asset"."contractId"
);

-- AssetScript: inherit from asset
UPDATE "AssetScript"
SET "companyId" = (
    SELECT "companyId" FROM "Asset" WHERE "Asset"."id" = "AssetScript"."assetId"
);

-- Inspection: inherit from contract
UPDATE "Inspection"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "Inspection"."contractId"
);

-- InspectionStep: inherit from inspection
UPDATE "InspectionStep"
SET "companyId" = (
    SELECT "companyId" FROM "Inspection" WHERE "Inspection"."id" = "InspectionStep"."inspectionId"
);

-- Report: inherit from contract
UPDATE "Report"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "Report"."contractId"
);

-- ReportVersion: inherit from report
UPDATE "ReportVersion"
SET "companyId" = (
    SELECT "companyId" FROM "Report" WHERE "Report"."id" = "ReportVersion"."reportId"
);

-- Photo: inherit from inspection or report (whichever exists)
UPDATE "Photo"
SET "companyId" = COALESCE(
    (SELECT "companyId" FROM "Inspection" WHERE "Inspection"."id" = "Photo"."inspectionId"),
    (SELECT "companyId" FROM "Report" WHERE "Report"."id" = "Photo"."reportId")
);

-- EmailQueue: inherit from contract
UPDATE "EmailQueue"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "EmailQueue"."contractId"
);

-- AuditLog: inherit from user
UPDATE "AuditLog"
SET "companyId" = (
    SELECT "companyId" FROM "User" WHERE "User"."id" = "AuditLog"."userId"
);

-- InspectionSchedule: inherit from contract
UPDATE "InspectionSchedule"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "InspectionSchedule"."contractId"
);

-- ScheduledInspection: inherit from contract
UPDATE "ScheduledInspection"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "ScheduledInspection"."contractId"
);

-- ScheduledInspectionStep: inherit from scheduled inspection
UPDATE "ScheduledInspectionStep"
SET "companyId" = (
    SELECT "companyId" FROM "ScheduledInspection" WHERE "ScheduledInspection"."id" = "ScheduledInspectionStep"."inspectionId"
);

-- MeasurementDevice: inherit from contract
UPDATE "MeasurementDevice"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "MeasurementDevice"."contractId"
);

-- MeasurementEntry: inherit from device
UPDATE "MeasurementEntry"
SET "companyId" = (
    SELECT "companyId" FROM "MeasurementDevice" WHERE "MeasurementDevice"."id" = "MeasurementEntry"."deviceId"
);

-- RelevantItem: inherit from contract
UPDATE "RelevantItem"
SET "companyId" = (
    SELECT "companyId" FROM "Contract" WHERE "Contract"."id" = "RelevantItem"."contractId"
);

-- RelevantItemAttachment: inherit from item
UPDATE "RelevantItemAttachment"
SET "companyId" = (
    SELECT "companyId" FROM "RelevantItem" WHERE "RelevantItem"."id" = "RelevantItemAttachment"."itemId"
);

-- ============================================
-- Step 6: Make companyId NOT NULL (except ReportTemplate)
-- ============================================

ALTER TABLE "User" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AssetScript" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Inspection" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "InspectionStep" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Report" ALTER COLUMN "companyId" SET NOT NULL;
-- ReportTemplate stays NULLABLE (null = global template)
ALTER TABLE "ReportVersion" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Photo" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "EmailQueue" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "InspectionSchedule" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "ScheduledInspection" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "ScheduledInspectionStep" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "MeasurementDevice" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "MeasurementEntry" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "RelevantItem" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "RelevantItemAttachment" ALTER COLUMN "companyId" SET NOT NULL;

-- ============================================
-- Step 7: Add Foreign Keys
-- ============================================

ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssetScript" ADD CONSTRAINT "AssetScript_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InspectionStep" ADD CONSTRAINT "InspectionStep_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailQueue" ADD CONSTRAINT "EmailQueue_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InspectionSchedule" ADD CONSTRAINT "InspectionSchedule_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledInspection" ADD CONSTRAINT "ScheduledInspection_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledInspectionStep" ADD CONSTRAINT "ScheduledInspectionStep_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeasurementDevice" ADD CONSTRAINT "MeasurementDevice_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeasurementEntry" ADD CONSTRAINT "MeasurementEntry_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RelevantItem" ADD CONSTRAINT "RelevantItem_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RelevantItemAttachment" ADD CONSTRAINT "RelevantItemAttachment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Step 8: Create Indexes for Performance
-- ============================================

CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_companyId_role_idx" ON "User"("companyId", "role");
CREATE INDEX "Contract_companyId_idx" ON "Contract"("companyId");
CREATE INDEX "Contract_companyId_active_idx" ON "Contract"("companyId", "active");
CREATE INDEX "Asset_companyId_idx" ON "Asset"("companyId");
CREATE INDEX "Asset_companyId_active_idx" ON "Asset"("companyId", "active");
CREATE INDEX "AssetScript_companyId_idx" ON "AssetScript"("companyId");
CREATE INDEX "Inspection_companyId_idx" ON "Inspection"("companyId");
CREATE INDEX "Inspection_companyId_status_idx" ON "Inspection"("companyId", "status");
CREATE INDEX "InspectionStep_companyId_idx" ON "InspectionStep"("companyId");
CREATE INDEX "Report_companyId_idx" ON "Report"("companyId");
CREATE INDEX "Report_companyId_status_idx" ON "Report"("companyId", "status");
CREATE INDEX "ReportTemplate_companyId_idx" ON "ReportTemplate"("companyId");
CREATE INDEX "ReportVersion_companyId_idx" ON "ReportVersion"("companyId");
CREATE INDEX "Photo_companyId_idx" ON "Photo"("companyId");
CREATE INDEX "EmailQueue_companyId_idx" ON "EmailQueue"("companyId");
CREATE INDEX "EmailQueue_companyId_status_idx" ON "EmailQueue"("companyId", "status");
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");
CREATE INDEX "AuditLog_companyId_userId_idx" ON "AuditLog"("companyId", "userId");
CREATE INDEX "InspectionSchedule_companyId_idx" ON "InspectionSchedule"("companyId");
CREATE INDEX "InspectionSchedule_companyId_active_idx" ON "InspectionSchedule"("companyId", "active");
CREATE INDEX "ScheduledInspection_companyId_idx" ON "ScheduledInspection"("companyId");
CREATE INDEX "ScheduledInspection_companyId_status_idx" ON "ScheduledInspection"("companyId", "status");
CREATE INDEX "ScheduledInspectionStep_companyId_idx" ON "ScheduledInspectionStep"("companyId");
CREATE INDEX "MeasurementDevice_companyId_idx" ON "MeasurementDevice"("companyId");
CREATE INDEX "MeasurementDevice_companyId_active_idx" ON "MeasurementDevice"("companyId", "active");
CREATE INDEX "MeasurementEntry_companyId_idx" ON "MeasurementEntry"("companyId");
CREATE INDEX "MeasurementEntry_companyId_deviceId_idx" ON "MeasurementEntry"("companyId", "deviceId");
CREATE INDEX "RelevantItem_companyId_idx" ON "RelevantItem"("companyId");
CREATE INDEX "RelevantItem_companyId_status_idx" ON "RelevantItem"("companyId", "status");
CREATE INDEX "RelevantItemAttachment_companyId_idx" ON "RelevantItemAttachment"("companyId");

-- ============================================
-- Migration Complete
-- ============================================
