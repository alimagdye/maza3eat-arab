-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "receiverHasRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requesterHasRead" BOOLEAN NOT NULL DEFAULT false;
