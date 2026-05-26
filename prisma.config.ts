import "dotenv/config";
import { defineConfig } from "prisma/config";

// Load dotenv properly
import { config } from "dotenv";
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});