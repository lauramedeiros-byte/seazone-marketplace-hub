import path from "node:path";
import type { PrismaConfig } from "prisma";

const config: PrismaConfig = {
  schema: path.join("prisma", "schema.prisma"),
};

if (process.env.DATABASE_URL) {
  config.datasource = {
    url: process.env.DATABASE_URL,
  };
}

export default config;