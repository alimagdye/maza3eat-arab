-- CreateTable
CREATE TABLE "Ban" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ban_userId_key" ON "Ban"("userId");

-- CreateIndex
CREATE INDEX "Ban_createdAt_idx" ON "Ban"("createdAt");

-- CreateIndex
CREATE INDEX "User_createdAt_id_idx" ON "User"("createdAt", "id");

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
