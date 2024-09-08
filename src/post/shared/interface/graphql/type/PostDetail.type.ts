import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('PostDetail')
export class PostDetail {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;
}
