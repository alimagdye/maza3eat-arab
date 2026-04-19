/*
  Warnings:

  - The values [REPLY_REPLY_POST,REPLY_REPLY_QUESTION] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ANSWER_REPLY', 'COMMENT_REPLY', 'ANSWER_REPLY_REPLY', 'COMMENT_REPLY_REPLY', 'ADMIN', 'CONTACT', 'COMMENT', 'LIKE', 'ANSWER', 'REPORT');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
