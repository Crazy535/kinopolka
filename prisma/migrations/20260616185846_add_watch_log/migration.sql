-- AlterTable
ALTER TABLE "shared_results" ALTER COLUMN "movieIds" DROP DEFAULT,
ALTER COLUMN "params" DROP DEFAULT;

-- CreateTable
CREATE TABLE "watch_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "isRewatch" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "watch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watch_logs_userId_watchedAt_idx" ON "watch_logs"("userId", "watchedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "watch_logs_userId_tmdbId_mediaType_watchedAt_key" ON "watch_logs"("userId", "tmdbId", "mediaType", "watchedAt");

-- AddForeignKey
ALTER TABLE "watch_logs" ADD CONSTRAINT "watch_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
