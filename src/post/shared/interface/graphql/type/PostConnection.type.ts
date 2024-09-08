import { Field, ObjectType } from '@nestjs/graphql';

import { PageInfo } from '@root/shared/interface/graphql/type/PageInfo.type';
import { PostEdge } from './PostEdge.type';

@ObjectType('PostConnection')
export class PostConnection {
  @Field(() => [PostEdge])
  edges: PostEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
