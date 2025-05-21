import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';
import { EmbeddingService } from './embedding.service';
import { PromptService } from './prompt.service';
import { DatabaseModule } from '../database/database.module';
import { OpenAIDatabaseService } from './database/database.service';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [OpenAIController],
  providers: [OpenAIService, EmbeddingService, PromptService, OpenAIDatabaseService],
  exports: [OpenAIService],
})
export class OpenAIModule {}