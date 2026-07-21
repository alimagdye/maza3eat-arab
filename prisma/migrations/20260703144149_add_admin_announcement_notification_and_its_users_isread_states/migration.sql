-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_ANNOUNCEMENT';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "recipientId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotificationReadState" (
    "id" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "adminNotificationId" TEXT NOT NULL,

    CONSTRAINT "AdminNotificationReadState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotification_notificationId_key" ON "AdminNotification"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationReadState_adminNotificationId_key" ON "AdminNotificationReadState"("adminNotificationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminNotificationReadState_userId_adminNotificationId_key" ON "AdminNotificationReadState"("userId", "adminNotificationId");

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotificationReadState" ADD CONSTRAINT "AdminNotificationReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotificationReadState" ADD CONSTRAINT "AdminNotificationReadState_adminNotificationId_fkey" FOREIGN KEY ("adminNotificationId") REFERENCES "AdminNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
