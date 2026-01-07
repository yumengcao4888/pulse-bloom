DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType') THEN
    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'ContactType'
        AND e.enumlabel = 'other'
    ) THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Healer'
          AND column_name = 'contactType'
      ) THEN
        CREATE TYPE "ContactType_new" AS ENUM ('email', 'phone', 'website', 'social');
        ALTER TABLE "Healer"
          ALTER COLUMN "contactType"
          TYPE "ContactType_new"
          USING ("contactType"::text::"ContactType_new");
        ALTER TYPE "ContactType" RENAME TO "ContactType_old";
        ALTER TYPE "ContactType_new" RENAME TO "ContactType";
        DROP TYPE "public"."ContactType_old";
      ELSE
        DROP TYPE "public"."ContactType";
        CREATE TYPE "ContactType" AS ENUM ('email', 'phone', 'website', 'social');
      END IF;
    END IF;
  ELSE
    CREATE TYPE "ContactType" AS ENUM ('email', 'phone', 'website', 'social');
    ALTER TABLE "Healer" ADD COLUMN IF NOT EXISTS "contactType" "ContactType";
  END IF;
END $$;
