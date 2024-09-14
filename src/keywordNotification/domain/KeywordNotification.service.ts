import { Inject, Injectable, Logger } from '@nestjs/common';
import type { KeywordNotificationRepository } from '@root/keywordNotification/domain/repository';
import * as mecab from 'mecab-ko-ts';
import * as winkTokenizer from 'wink-tokenizer';

@Injectable()
export class KeywordNotificationService {
  private tokenizer: any;

  constructor(
    @Inject('KeywordNotificationRepository')
    private readonly keywordNotificationRepository: KeywordNotificationRepository,
  ) {
    this.tokenizer = winkTokenizer();
  }

  async KeywordNotification(input: { postId: string; title: string; author: string; content: string }) {
    const { postId, title, author, content } = input;

    const keywords = Array.from(
      new Set([
        ...this.extractEnglishKeywords(content),
        ...this.extractKoreanKeywords(content),
        ...this.extractEnglishKeywords(title),
        ...this.extractKoreanKeywords(title),
      ]),
    );

    const keywordNotifications = await this.keywordNotificationRepository.findByKeywords(keywords);

    Logger.log(`${keywords.join(', ')} 키워드가 포함된 게시글이 생성되었습니다. 키워드 알림기능!`);
    Logger.log(
      `db에 등록된 키워드 알림: ${keywordNotifications.map((keywordNotification) => JSON.stringify(keywordNotification)).join(', ')}`,
    );
  }

  private extractEnglishKeywords(content: string): string[] {
    const tokens = this.tokenizer.tokenize(content);
    return tokens.filter((token) => token.tag === 'word').map((token) => token.value);
  }

  private extractKoreanKeywords(content: string): string[] {
    return mecab.nounsSync(content) as unknown as string[];
  }
}
