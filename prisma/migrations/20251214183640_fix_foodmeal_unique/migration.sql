/*
  Warnings:

  - A unique constraint covering the columns `[foodDayId,index]` on the table `FoodMeal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FoodMeal_foodDayId_index_key" ON "public"."FoodMeal"("foodDayId", "index");
