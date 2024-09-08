import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly topicHandlers: Map<string, (payload: EachMessagePayload) => Promise<void>> = new Map();

  constructor(@Inject('KAFKA_CONSUMER') private readonly consumer: Consumer) {}

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    console.log('Kafka Consumer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
    console.log('Kafka Consumer disconnected');
  }

  async subscribe(topics: string[], messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
    topics.forEach((topic) => {
      this.topicHandlers.set(topic, messageHandler);
    });

    await this.consumer.subscribe({ topics, fromBeginning: false });
    console.log(`Subscribed to topics: ${topics.join(', ')}`);

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const handler = this.topicHandlers.get(payload.topic);
        if (handler) {
          try {
            await handler(payload);
          } catch (error) {
            console.error('메시지 처리 중 오류 발생:', error);
          }
        } else {
          console.warn(`No handler found for topic: ${payload.topic}`);
        }
      },
    });
  }

  async pause(topics: string[]): Promise<void> {
    await this.consumer.pause(topics.map((topic) => ({ topic })));
    console.log(`Paused topics: ${topics.join(', ')}`);
  }

  async resume(topics: string[]): Promise<void> {
    await this.consumer.resume(topics.map((topic) => ({ topic })));
    console.log(`Resumed topics: ${topics.join(', ')}`);
  }
}
