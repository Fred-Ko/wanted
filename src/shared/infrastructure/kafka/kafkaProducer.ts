import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Message, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class KafkaProducer implements OnModuleDestroy {
  constructor(@Inject('KAFKA_PRODUCER') private readonly producer: Producer) {}

  async publish(topic: string, message: any, headers?: Record<string, string>): Promise<void> {
    const kafkaMessage: Message = {
      value: JSON.stringify(message),
    };

    if (headers) {
      kafkaMessage.headers = headers;
    }

    const producerRecord: ProducerRecord = {
      topic,
      messages: [kafkaMessage],
    };

    await this.producer.send(producerRecord);
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }
}
