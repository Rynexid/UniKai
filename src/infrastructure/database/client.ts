import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../db";

/*
 * klien Drizzle yang dipakai serverless/edge: setiap query = 1 HTTP request
 * ke Neon, tidak perlu koneksi TCP persisten.
 */
const sql = neon(process.env.DATABASE_URL as string);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export type Database = NeonHttpDatabase<typeof schema>;
