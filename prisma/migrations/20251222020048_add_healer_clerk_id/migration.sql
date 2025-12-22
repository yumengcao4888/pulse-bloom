/*
  Warnings:

  - A unique constraint covering the columns `[clerkId]` on the table `Healer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Healer" RENAME CONSTRAINT "Practitioner_pkey" TO "Healer_pkey";

ALTER TABLE "Healer" ADD COLUMN "clerkId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Healer_clerkId_key" ON "Healer"("clerkId");
