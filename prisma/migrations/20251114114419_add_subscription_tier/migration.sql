-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('basic', 'pro', 'premium');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT 'basic';
