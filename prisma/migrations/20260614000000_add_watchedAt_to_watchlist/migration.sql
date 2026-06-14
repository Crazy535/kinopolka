-- AlterTable: add optional watchedAt field to watchlist_items
ALTER TABLE "watchlist_items" ADD COLUMN "watchedAt" TIMESTAMP(3);
