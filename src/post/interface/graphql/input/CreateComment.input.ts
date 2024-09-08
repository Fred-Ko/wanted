import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  postId: number;

  @Field(() => String)
  content: string;

  @Field(() => String)
  author: string;

  @Field(() => ID, { nullable: true })
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  parentId?: number;
}
