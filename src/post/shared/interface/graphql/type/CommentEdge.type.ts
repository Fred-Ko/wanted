import { Field, ObjectType } from '@nestjs/graphql';
import { Comment } from './Comment.type';

@ObjectType('CommentEdge')
export class CommentEdge {
  @Field(() => Comment)
  node: Comment;

  @Field()
  cursor: string;
}
