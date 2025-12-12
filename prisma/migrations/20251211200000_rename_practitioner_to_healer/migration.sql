-- Rename Practitioner table and related references to Healer
ALTER TABLE "Reflection" DROP CONSTRAINT IF EXISTS "Reflection_practitionerId_fkey";

ALTER TABLE "Reflection" RENAME COLUMN "practitionerId" TO "healerId";

ALTER TABLE "Practitioner" RENAME TO "Healer";

ALTER INDEX IF EXISTS "Practitioner_slug_key" RENAME TO "Healer_slug_key";

ALTER TABLE "Reflection"
  ADD CONSTRAINT "Reflection_healerId_fkey"
  FOREIGN KEY ("healerId") REFERENCES "Healer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
