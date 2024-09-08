import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { KeywordNotificationModule } from '@root/keywordNotification/KeywordNotification.module';
import { PostModule } from '@root/post/Post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      autoTransformHttpErrors: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    PostModule,
    KeywordNotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
