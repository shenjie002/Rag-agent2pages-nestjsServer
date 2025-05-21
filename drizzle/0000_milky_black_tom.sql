CREATE TABLE "open_ai_embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "open_ai_embedding_index" ON "open_ai_embeddings" USING hnsw ("embedding" vector_cosine_ops);