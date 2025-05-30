import { sql } from "drizzle-orm";

import { db } from "@/db";

async function resetDatabase() {
  try {
    // Drop all tables
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    console.log("Database reset successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
  } finally {
    process.exit(0);
  }
}

resetDatabase(); 