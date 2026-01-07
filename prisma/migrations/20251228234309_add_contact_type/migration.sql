DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType') THEN
    CREATE TYPE "ContactType" AS ENUM ('email', 'phone', 'website', 'social', 'other');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Healer'
      AND column_name = 'contactType'
  ) THEN
    ALTER TABLE "Healer" ADD COLUMN "contactType" "ContactType";
  END IF;
END $$;
