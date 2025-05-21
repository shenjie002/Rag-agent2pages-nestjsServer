import { Controller, Post, Req, Res, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { OpenAIService } from './openai.service';
import { OpenAIRequest } from './types';
import { EmbeddingService } from './embedding.service';

@Controller('api/openai')
export class OpenAIController {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post()
  async handleChatCompletion(@Body() request: OpenAIRequest, @Res() res: Response) {
    try {
      const { messages } = request;
      
      // 获取流式聊天补全
      const { result, relevantContent } = await this.openaiService.createStreamingChatCompletion(messages);

      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 创建SSE消息格式的工具函数
      const createEnqueueContent = (
        relevantContent: Array<{ content: string; similarity: number }>,
        aiResponse: string
      ) => {
        const data = {
          relevantContent: relevantContent || [],
          aiResponse: aiResponse || ''
        };

        return `event: message\ndata: ${JSON.stringify(data)}\n\n`;
      };

      // 处理流式响应
      for await (const chunk of await result) {
        const content = chunk?.choices?.[0]?.delta?.content || '';
        if (content) {
          res.write(createEnqueueContent(relevantContent, content));
        }
      }

      // 完成响应
      res.end();
    } catch (error) {
      console.error('Error in chat completion:', error);
      res.status(400).send(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }

  @Post('embeddings')
  async createEmbeddings(@Body() body: { content: string }, @Res() res: Response) {
    try {
      const result = await this.embeddingService.createResource(body.content);
      res.status(200).json({ message: result });
    } catch (error) {
      console.error('Error creating embeddings:', error);
      res.status(400).send(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
}