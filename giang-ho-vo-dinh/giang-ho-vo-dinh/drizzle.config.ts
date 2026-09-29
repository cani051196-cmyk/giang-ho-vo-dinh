import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './migrations/generated',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/giang_ho_vo_dinh'
  }
});
