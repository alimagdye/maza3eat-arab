-- CreateTable
CREATE TABLE "TierUpgradeNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "oldTierId" INTEGER NOT NULL,
    "newTierId" INTEGER NOT NULL,

    CONSTRAINT "TierUpgradeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TierUpgradeNotification_notificationId_key" ON "TierUpgradeNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "TierUpgradeNotification" ADD CONSTRAINT "TierUpgradeNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierUpgradeNotification" ADD CONSTRAINT "TierUpgradeNotification_oldTierId_fkey" FOREIGN KEY ("oldTierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierUpgradeNotification" ADD CONSTRAINT "TierUpgradeNotification_newTierId_fkey" FOREIGN KEY ("newTierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
