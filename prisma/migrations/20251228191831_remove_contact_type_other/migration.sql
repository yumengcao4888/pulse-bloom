-- AlterEnum
BEGIN;
CREATE TYPE "ContactType_new" AS ENUM ('email', 'phone', 'website', 'social');
ALTER TABLE "Healer" ALTER COLUMN "contactType" TYPE "ContactType_new" USING ("contactType"::text::"ContactType_new");
ALTER TYPE "ContactType" RENAME TO "ContactType_old";
ALTER TYPE "ContactType_new" RENAME TO "ContactType";
DROP TYPE "public"."ContactType_old";
COMMIT;
