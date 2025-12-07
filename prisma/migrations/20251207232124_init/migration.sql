-- CreateTable
CREATE TABLE "Practitioner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pronouns" TEXT,
    "modality" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "city" TEXT,
    "contact" TEXT,
    "bio" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Practitioner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" SERIAL NOT NULL,
    "grounded" BOOLEAN,
    "supported" BOOLEAN,
    "connected" BOOLEAN,
    "feeling" TEXT,
    "practitionerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Practitioner_slug_key" ON "Practitioner"("slug");

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "Practitioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
