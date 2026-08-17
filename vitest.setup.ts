import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, beforeEach } from "vitest";

// Vitest runs test files in parallel, so each one gets its own database file.
// Sharing a single SQLite file would let one file's cleanup delete rows another
// file is still asserting on.
const directory = mkdtempSync(join(tmpdir(), "splitsy-test-"));
const databasePath = join(directory, "test.db");

const migrationsDirectory = join(process.cwd(), "prisma", "migrations");
const migrations = readdirSync(migrationsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const database = new DatabaseSync(databasePath);
for (const migration of migrations) {
  database.exec(
    readFileSync(join(migrationsDirectory, migration, "migration.sql"), "utf8"),
  );
}
database.close();

// Read by src/lib/prisma.ts when the test file imports it, which happens after
// this setup file has finished.
process.env.DATABASE_URL = `file:${databasePath}`;

beforeEach(async () => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});
