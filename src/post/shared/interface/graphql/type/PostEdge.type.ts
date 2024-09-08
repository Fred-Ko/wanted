import { Field, ObjectType } from '@nestjs/graphql';
import { Post } from './Post.type';

@ObjectType('PostEdge')
export class PostEdge {
  @Field(() => Post)
  node: Post;

  @Field()
  cursor: string;
}
