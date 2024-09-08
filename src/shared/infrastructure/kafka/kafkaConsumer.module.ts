import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumerConfig, Kafka, KafkaConfig } from 'kafkajs';
import { KafkaConsumer } from './kafkaConsumer';

@Module({})
export class KafkaConsumerModule {
  static forFeature(options: {
    useFactory: (configService: ConfigService) => Promise<KafkaConfig> | KafkaConfig;
    inject: any[];
    consumerConfig?: ConsumerConfig;
  }): DynamicModule {
    return {
      module: KafkaConsumerModule,
      providers: [
        {
          provide: 'KAFKA_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: 'KAFKA_CONSUMER',
          useFactory: async (kafkaOptions: KafkaConfig) => {
            const kafkaClient = new Kafka(kafkaOptions);
            const consumer = kafkaClient.consumer(options.consumerConfig || { groupId: 'post_domain' });
            return consumer;
          },
          inject: ['KAFKA_OPTIONS'],
        },
        KafkaConsumer,
      ],
      exports: [KafkaConsumer],
    };
  }
}
