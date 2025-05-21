import { v4 as uuidv4 } from 'uuid';
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core';

export const openAiEmbeddings = pgTable(
  'open_ai_embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  (table) => ({
    openAiEmbeddingIndex: index('open_ai_embedding_index').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);
