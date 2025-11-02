/*
  Warnings:

  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENT', 'FLAT');

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Announcement" ADD COLUMN     "discountType" "public"."DiscountType",
ADD COLUMN     "discountValue" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "discountType" "public"."DiscountType",
ADD COLUMN     "discountValue" INTEGER DEFAULT 0,
ADD COLUMN     "finalAmount" INTEGER,
ADD COLUMN     "gateway" TEXT NOT NULL DEFAULT 'moyasar',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
