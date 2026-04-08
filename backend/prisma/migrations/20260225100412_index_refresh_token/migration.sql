/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_createdAt_idx" ON "RefreshToken"("createdAt");

-- CreateIndex
CREATE INDEX "User_isDeleted_isBanned_idx" ON "User"("isDeleted", "isBanned");

-- CreateIndex
CREATE INDEX "User_tierId_idx" ON "User"("tierId");
