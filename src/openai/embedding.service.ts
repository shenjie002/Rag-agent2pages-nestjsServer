import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { OpenAIDatabaseService } from './database/database.service';

@Injectable()
export class EmbeddingService {
  private embeddingAI: OpenAI;

  constructor(
    private configService: ConfigService,
    private openAIDatabaseService: OpenAIDatabaseService,
  ) {
    this.embeddingAI = new OpenAI({
      apiKey: this.configService.get<string>('AI_KEY'),
      baseURL: this.configService.get<string>('AI_BASE_URL'),
      ...(this.configService.get<string>('HTTP_AGENT')
        ? {
            httpAgent: new HttpsProxyAgent(
              this.configService.get<string>('HTTP_AGENT') as string,
            ),
          }
        : {}),
    });
  }

  // 将输入文本按分隔符切分成多个文本块
  private generateChunks(input: string): string[] {
    return input.split('-------split line-------');
  }

  // 为多个文本块生成嵌入向量
  async generateEmbeddings(
    value: string,
  ): Promise<Array<{ embedding: number[]; content: string }>> {
    const chunks = this.generateChunks(value);

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await this.embeddingAI.embeddings.create({
          model: this.configService.get<string>('EMBEDDING') as string,
          input: chunk,
        });
        return {
          content: chunk,
          embedding: response.data[0].embedding,
        };
      }),
    );

    return embeddings;
  }

  // 为单个文本生成嵌入向量
  async generateEmbedding(value: string): Promise<number[]> {
    const input = value.replaceAll('\\n', ' ');
    const response = await this.embeddingAI.embeddings.create({
      model: this.configService.get<string>('EMBEDDING') as string,
      input,
    });
    return response.data[0].embedding;
  }

  // 创建资源并存储嵌入向量
  async createResource(value: string): Promise<string> {
    const embeddings = await this.generateEmbeddings(value);
    return this.openAIDatabaseService.createResource(embeddings);
  }

  // 根据用户查询找到相关的文档内容
  async findRelevantContent(
    userQuery: string,
  ): Promise<{ content: string; similarity: number }[]> {
    const userQueryEmbedded = await this.generateEmbedding(userQuery);
    return this.openAIDatabaseService.findSimilarContent(userQueryEmbedded);
  }
}
