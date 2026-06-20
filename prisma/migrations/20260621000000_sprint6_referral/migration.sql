-- Sprint 6: Referral Program
-- Add referralCode and referredById to users table

ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "users" ADD COLUMN "referredById" TEXT;

-- Backfill referral codes for existing users
UPDATE "users"
SET "referralCode" = LOWER(REPLACE(gen_random_uuid()::text, '-', ''))
WHERE "referralCode" IS NULL;

-- Add unique and FK constraints
ALTER TABLE "users" ADD CONSTRAINT "users_referralCode_key" UNIQUE ("referralCode");

ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_referredById_idx" ON "users"("referredById");
