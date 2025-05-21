import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { openAiEmbeddings } from './schema';
import { sql, gt, desc } from 'drizzle-orm';
import { cosineDistance } from 'drizzle-orm/sql';

@Injectable()
export class OpenAIDatabaseService {
  constructor(private databaseService: DatabaseService) {}

  async createResource(
    embeddings: Array<{ embedding: number[]; content: string }>,
  ): Promise<string> {
    try {
      const res = await this.databaseService
        .getDb()
        .insert(openAiEmbeddings)
        .values(
          embeddings.map((embedding) => ({
            ...embedding,
          })),
        );
      console.log('res', res);
      // Return a success message or any other relevant informatio
      return 'Resource successfully created and embedded.';
    } catch (error) {
      console.log('error', error);
      return error instanceof Error && error.message.length > 0
        ? error.message
        : 'Error, please try again.';
    }
  }

  async findSimilarContent(userQueryEmbedded: number[]) {
    const similarity = sql<number>`1 - (${cosineDistance(
      openAiEmbeddings.embedding,
      userQueryEmbedded,
    )})`;

    const similarGuides = await this.databaseService
      .getDb()
      .select({
        content: openAiEmbeddings.content,
        similarity,
      })
      .from(openAiEmbeddings)
      .where(gt(similarity, 0.5))
      .orderBy((t) => desc(t.similarity))
      .limit(4);

    return similarGuides;
  }
}
