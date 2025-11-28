-- CreateTable
CREATE TABLE "Practitioner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "pronoun" TEXT,
    "modality" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "city" TEXT,
    "contact" TEXT,
    "bio" TEXT NOT NULL
);
