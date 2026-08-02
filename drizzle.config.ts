import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Path schema sekarang relatif ke root repo, karena drizzle-kit dijalankan dari root
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  strict: true,
  verbose: true,
});
