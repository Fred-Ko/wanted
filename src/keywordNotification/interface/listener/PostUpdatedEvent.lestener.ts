import { Inject, Injectable } from '@nestjs/common';
import { KeywordNotificationService } from '@root/keywordNotification/domain/KeywordNotification.service';
import { KafkaConsumer } from '@root/shared/infrastructure/kafka/kafkaConsumer';

@Injectable()
export class PostUpdatedEventListener {
  constructor(
    @Inject(KafkaConsumer) private readonly kafkaConsumer: KafkaConsumer,
    @Inject(KeywordNotificationService) private readonly keywordNotificationService: KeywordNotificationService,
  ) {
    this.kafkaConsumer.subscribe(['PostUpdatedEvent'], async (payload) => {
      const { postId, title, author, content } = JSON.parse(payload.message.value.toString());
      await this.keywordNotificationService.KeywordNotification({ postId, title, author, content });
    });
  }
}
