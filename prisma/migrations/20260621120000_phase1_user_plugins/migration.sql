-- Phase 1: Plugins scaffold
-- Per-user enable/disable state for first-party plugins (registry-based)

CREATE TABLE "user_plugins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pluginId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plugins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_plugins_userId_pluginId_key" ON "user_plugins"("userId", "pluginId");

CREATE INDEX "user_plugins_userId_idx" ON "user_plugins"("userId");

ALTER TABLE "user_plugins" ADD CONSTRAINT "user_plugins_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_plugins" ENABLE ROW LEVEL SECURITY;
