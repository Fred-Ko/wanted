import { KeywordNotification } from '@prisma/client';

export interface KeywordNotificationRepository {
  findByKeywords(keywords: string[]): Promise<KeywordNotification[]>;
}
