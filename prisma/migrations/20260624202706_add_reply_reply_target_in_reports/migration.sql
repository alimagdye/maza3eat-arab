/*
  Warnings:

  - The values [REPLY] on the enum `ReportTargetType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportTargetType_new" AS ENUM ('COMMENT', 'ANSWER', 'COMMENT_REPLY', 'ANSWER_REPLY', 'ANSWER_REPLY_REPLY', 'COMMENT_REPLY_REPLY', 'CONTACT_REQUEST');
ALTER TABLE "Report" ALTER COLUMN "targetType" TYPE "ReportTargetType_new" USING ("targetType"::text::"ReportTargetType_new");
ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
ALTER TYPE "ReportTargetType_new" RENAME TO "ReportTargetType";
DROP TYPE "public"."ReportTargetType_old";
COMMIT;
