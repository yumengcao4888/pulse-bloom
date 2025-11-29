-- CreateTable
CREATE TABLE "Practitioner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pronouns" TEXT,
    "city" TEXT,
    "contact" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_slug_key" ON "Practitioner"("slug");
