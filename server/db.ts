import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Ensure the spatial schema exists (needed for captures/hotspots tables)
pool.query("CREATE SCHEMA IF NOT EXISTS spatial").catch((err) => {
  console.error("Failed to create spatial schema:", err);
});

export const db = drizzle(pool, { schema });
