import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '@root/shared/interface/graphql/type/PageInfo.type';
import { CommentEdge } from './CommentEdge.type';

@ObjectType('CommentConnection')
export class CommentConnection {
  @Field(() => [CommentEdge])
  edges: CommentEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
