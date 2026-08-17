import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

// Next.js re-evaluates modules on every hot reload, which would open a new
// connection pool each time. Tests deliberately skip this cache: each test file
// points at its own database file and must not be handed another one's client.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}
