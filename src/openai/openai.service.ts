import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ChatModel } from 'openai/resources/index.mjs';
import { EmbeddingService } from './embedding.service';
import { PromptService } from './prompt.service';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
    private promptService: PromptService,
  ) {
    this.openai = new OpenAI({
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

  async createChatCompletion(messages: ChatCompletionMessageParam[]) {
    try {
      // 获取最后一条消息用于相关性搜索
      const lastMessage = messages[messages.length - 1];

      // 处理最后一条消息的内容
      const lastMessageContentString =
        Array.isArray(lastMessage.content) && lastMessage.content.length > 0
          ? lastMessage.content
              .map((c) => (c.type === 'text' ? c.text : ''))
              .join('')
          : (lastMessage.content as string);

      // 使用文本嵌入搜索相关文档内容
      const relevantContent = await this.embeddingService.findRelevantContent(
        lastMessageContentString,
      );

      // 创建OpenAI聊天补全请求
      const result = await this.openai.chat.completions.create({
        model:
          (this.configService.get<string>('MODEL') as ChatModel) || 'gpt-4o',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: this.promptService.getSystemPrompt(
              relevantContent.map((c) => c.content).join('\n'),
            ),
          },
          ...messages,
        ],
      });

      return { result, relevantContent };
    } catch (error) {
      throw error;
    }
  }

  async createStreamingChatCompletion(messages: ChatCompletionMessageParam[]) {
    try {
      // 获取最后一条消息用于相关性搜索
      const lastMessage = messages[messages.length - 1];

      // 处理最后一条消息的内容
      const lastMessageContentString =
        Array.isArray(lastMessage.content) && lastMessage.content.length > 0
          ? lastMessage.content
              .map((c) => (c.type === 'text' ? c.text : ''))
              .join('')
          : (lastMessage.content as string);

      // 使用文本嵌入搜索相关文档内容
      const relevantContent = await this.embeddingService.findRelevantContent(
        lastMessageContentString,
      );

      // 创建OpenAI聊天补全请求（流式）
      const result = this.openai.chat.completions.create({
        model:
          (this.configService.get<string>('MODEL') as ChatModel) || 'gpt-4o',
        max_tokens: 4096,
        stream: true,
        messages: [
          {
            role: 'system',
            content: this.promptService.getSystemPrompt(
              relevantContent.map((c) => c.content).join('\n'),
            ),
          },
          ...messages,
        ],
      });

      return { result, relevantContent };
    } catch (error) {
      throw error;
    }
  }
}
