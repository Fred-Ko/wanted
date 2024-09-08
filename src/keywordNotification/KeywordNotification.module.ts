import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeywordNotificationRepositoryImpl } from '@root/keywordNotification/infrastructure/KeywordNotification.repository.impl';
import { PostCreatedEventListener } from '@root/keywordNotification/interface/listener/PostCreatedEvent.listener';
import { PostUpdatedEventListener } from '@root/keywordNotification/interface/listener/PostUpdatedEvent.lestener';
import { KafkaConsumerModule } from '@root/shared/infrastructure/kafka/kafkaConsumer.module';
import { PrismaService } from '@root/shared/infrastructure/prisma';
import { KeywordNotificationService } from './domain/KeywordNotification.service';

function generateRandomId(length: number): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

@Module({
  imports: [
    KafkaConsumerModule.forFeature({
      useFactory: async (configService: ConfigService) => ({
        clientId: `post_domain_${generateRandomId(5)}`,
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:29092').split(','),
      }),
      inject: [ConfigService],
      consumerConfig: {
        groupId: 'keyword_notification_domain',
      },
    }),
  ],
  providers: [
    KeywordNotificationService,
    {
      provide: 'KeywordNotificationRepository',
      useClass: KeywordNotificationRepositoryImpl,
    },
    PrismaService,
    PostCreatedEventListener,
    PostUpdatedEventListener,
  ],
  exports: [KeywordNotificationService],
})
export class KeywordNotificationModule {}
