import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  content: string;

  @Field(() => String)
  author: string;

  @Field(() => ID, { nullable: true })
  parentId?: number;

  @Field(() => Date)
  createdAt: Date;
}
