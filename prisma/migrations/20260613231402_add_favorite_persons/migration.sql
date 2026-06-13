-- CreateTable
CREATE TABLE "favorite_persons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_persons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_persons_userId_idx" ON "favorite_persons"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_persons_userId_tmdbId_key" ON "favorite_persons"("userId", "tmdbId");

-- AddForeignKey
ALTER TABLE "favorite_persons" ADD CONSTRAINT "favorite_persons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
