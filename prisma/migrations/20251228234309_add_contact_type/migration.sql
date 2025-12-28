-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('email', 'phone', 'website', 'social', 'other');

-- AlterTable
ALTER TABLE "Healer" ADD COLUMN     "contactType" "ContactType";
