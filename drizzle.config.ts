import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/openai/database/schema.ts',
  dialect: 'postgresql',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  tablesFilter: ['!langchain_embeddings', '!llamaindex_embeddings'],
} satisfies Config;
