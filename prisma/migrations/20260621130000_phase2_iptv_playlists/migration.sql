-- Phase 2: IPTV playlists
-- Channels are NOT stored — parsed on demand from sourceUrl/rawContent.

CREATE TABLE "iptv_playlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "rawContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "iptv_playlists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "iptv_playlists_userId_idx" ON "iptv_playlists"("userId");

ALTER TABLE "iptv_playlists" ADD CONSTRAINT "iptv_playlists_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "iptv_playlists" ENABLE ROW LEVEL SECURITY;
