import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PostDetailInput {
  @Field()
  content: string;
}

@InputType()
export class CreatePostInput {
  @Field()
  title: string;

  @Field()
  postDetail: PostDetailInput;

  @Field()
  author: string;

  @Field()
  password: string;
}
