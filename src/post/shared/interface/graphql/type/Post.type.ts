import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Post')
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field()
  author: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
