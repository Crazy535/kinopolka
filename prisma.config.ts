import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI читает .env.local (Next.js convention)
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL для CLI-команд (prisma migrate, db push, introspect)
    // Supabase требует прямое соединение для DDL-операций
    url: process.env["DIRECT_URL"],
  },
});
