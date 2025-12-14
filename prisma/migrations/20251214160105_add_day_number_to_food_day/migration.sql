/*
  Warnings:

  - A unique constraint covering the columns `[userId,dayNumber]` on the table `FoodDay` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."FoodDay" ALTER COLUMN "date" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FoodDay_userId_dayNumber_key" ON "public"."FoodDay"("userId", "dayNumber");
