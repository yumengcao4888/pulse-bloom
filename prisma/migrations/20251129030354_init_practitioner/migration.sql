/*
  Warnings:

  - You are about to drop the column `pronoun` on the `Practitioner` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Practitioner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "pronouns" TEXT,
    "city" TEXT,
    "contact" TEXT
);
INSERT INTO "new_Practitioner" ("bio", "city", "contact", "createdAt", "focus", "id", "modality", "name", "updatedAt") SELECT "bio", "city", "contact", "createdAt", "focus", "id", "modality", "name", "updatedAt" FROM "Practitioner";
DROP TABLE "Practitioner";
ALTER TABLE "new_Practitioner" RENAME TO "Practitioner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
