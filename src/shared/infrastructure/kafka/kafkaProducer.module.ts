import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, KafkaConfig, Partitioners } from 'kafkajs';
import { KafkaProducer } from './kafkaProducer';

@Module({})
export class KafkaModule {
  static forFeature(options: {
    useFactory: (configService: ConfigService) => Promise<KafkaConfig> | KafkaConfig;
    inject: any[];
  }): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        {
          provide: 'KAFKA_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: 'KAFKA_PRODUCER',
          useFactory: async (kafkaOptions: KafkaConfig) => {
            const kafkaClient = new Kafka(kafkaOptions);
            const producer = kafkaClient.producer({
              createPartitioner: Partitioners.LegacyPartitioner,
            });
            await producer.connect();
            return producer;
          },
          inject: ['KAFKA_OPTIONS'],
        },
        KafkaProducer,
      ],
      exports: [KafkaProducer],
    };
  }
}
