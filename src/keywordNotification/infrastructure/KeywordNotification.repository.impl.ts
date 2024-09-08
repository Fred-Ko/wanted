import { Inject, Injectable } from '@nestjs/common';
import type { KeywordNotification } from '@prisma/client';
import type { KeywordNotificationRepository } from '@root/keywordNotification/domain/repository';
import { PrismaService } from '@root/shared/infrastructure/prisma';

@Injectable()
export class KeywordNotificationRepositoryImpl implements KeywordNotificationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByKeywords(keywords: string[]): Promise<KeywordNotification[]> {
    return this.prisma.keywordNotification.findMany({
      where: {
        keyword: {
          in: keywords,
        },
      },
    });
  }
}
