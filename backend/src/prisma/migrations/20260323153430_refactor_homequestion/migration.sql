/*
  Warnings:

  - You are about to drop the column `scope` on the `HomeQuestion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[position]` on the table `HomeQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[questionId]` on the table `HomeQuestion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "HomeQuestion_scope_position_key";

-- DropIndex
DROP INDEX "HomeQuestion_scope_questionId_key";

-- AlterTable
ALTER TABLE "HomeQuestion" DROP COLUMN "scope";

-- CreateIndex
CREATE UNIQUE INDEX "HomeQuestion_position_key" ON "HomeQuestion"("position");

-- CreateIndex
CREATE UNIQUE INDEX "HomeQuestion_questionId_key" ON "HomeQuestion"("questionId");
