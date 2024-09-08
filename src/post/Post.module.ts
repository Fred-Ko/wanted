import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostService } from '@root/post/domain/Post.service';
import { CommentRepositoryImpl } from '@root/post/infrastructure/Comment.repository.impl';

import { PostRepositoryImpl } from '@root/post/infrastructure/Post.repository.impl';

import { PostResolver } from '@root/post/interface/graphql/Post.resolver';

import { KafkaModule } from '@root/shared/infrastructure/kafka/kafkaProducer.module';
import { PrismaService } from '@root/shared/infrastructure/prisma';

function generateRandomId(length: number): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

@Module({
  imports: [
    KafkaModule.forFeature({
      useFactory: async (configService: ConfigService) => ({
        clientId: `post_domain_${generateRandomId(5)}`,
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:29092').split(','),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PostResolver,
    {
      provide: PostService,
      useClass: PostService,
    },
    {
      provide: 'PostRepository',
      useClass: PostRepositoryImpl,
    },
    {
      provide: PrismaService,
      useClass: PrismaService,
    },
    {
      provide: 'CommentRepository',
      useClass: CommentRepositoryImpl,
    },
  ],
  exports: [PostService],
})
export class PostModule {}
