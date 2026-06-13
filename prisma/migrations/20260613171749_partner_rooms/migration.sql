-- CreateTable
CREATE TABLE "partner_rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "hostGenreIds" INTEGER[],
    "guestGenreIds" INTEGER[],
    "resultIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_rooms_code_key" ON "partner_rooms"("code");

-- CreateIndex
CREATE INDEX "partner_rooms_hostId_idx" ON "partner_rooms"("hostId");

-- AddForeignKey
ALTER TABLE "partner_rooms" ADD CONSTRAINT "partner_rooms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_rooms" ADD CONSTRAINT "partner_rooms_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
