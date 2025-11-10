-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "startWeight" DOUBLE PRECISION,
ADD COLUMN     "targetWeight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."WeightLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeightLog_userId_date_idx" ON "public"."WeightLog"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."WeightLog" ADD CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
