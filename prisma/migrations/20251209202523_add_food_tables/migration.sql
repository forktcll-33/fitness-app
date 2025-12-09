-- CreateTable
CREATE TABLE "public"."FoodDay" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FoodMeal" (
    "id" SERIAL NOT NULL,
    "foodDayId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FoodMealItem" (
    "id" SERIAL NOT NULL,
    "mealId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "foodKey" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "kcals" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodMealItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."FoodDay" ADD CONSTRAINT "FoodDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FoodMeal" ADD CONSTRAINT "FoodMeal_foodDayId_fkey" FOREIGN KEY ("foodDayId") REFERENCES "public"."FoodDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FoodMealItem" ADD CONSTRAINT "FoodMealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "public"."FoodMeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
