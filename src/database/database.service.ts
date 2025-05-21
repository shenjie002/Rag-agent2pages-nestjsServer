import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

@Injectable()
export class DatabaseService {
  private db: ReturnType<typeof drizzle>;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    
    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  getDb() {
    return this.db;
  }
}
import { openAiEmbeddings } from '../openai/database/schema';
import { sql, gt, desc } from 'drizzle-orm';
import { cosineDistance } from 'drizzle-orm/sql';

@Injectable()
export class OpenAIDatabaseService {
  constructor(private databaseService: DatabaseService) {}

  async createResource(
    embeddings: Array<{ embedding: number[]; content: string }>
  ): Promise<string> {
    try {
      await this.databaseService.getDb().insert(openAiEmbeddings).values(
        embeddings.map((embedding) => ({
          ...embedding
        }))
      );

      return 'Resource successfully created and embedded.';
    } catch (error) {
      console.log('error', error);
      return error instanceof Error && error.message.length > 0
        ? error.message
        : 'Error, please try again.';
    }
  }

  async findSimilarContent(userQueryEmbedded: number[]) {
    const similarity = sql<number>`1 - (${
      cosineDistance(openAiEmbeddings.embedding, userQueryEmbedded)
    })`;
    
    const similarGuides = await this.databaseService.getDb()
      .select({
        content: openAiEmbeddings.content,
        similarity
      })
      .from(openAiEmbeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(4);
    
    return similarGuides;
  }
}