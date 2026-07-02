-- Индекс для ежедневного cleanup-крона (/api/cleanup):
-- deleteMany where expiresAt < now() иначе делает seq scan по partner_rooms.

CREATE INDEX "partner_rooms_expiresAt_idx" ON "partner_rooms"("expiresAt");
