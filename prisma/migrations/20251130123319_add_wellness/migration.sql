-- CreateTable
CREATE TABLE "public"."Wellness" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "water" INTEGER NOT NULL DEFAULT 0,
    "sleep" INTEGER NOT NULL DEFAULT 0,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wellness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wellness_userId_date_key" ON "public"."Wellness"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."Wellness" ADD CONSTRAINT "Wellness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
