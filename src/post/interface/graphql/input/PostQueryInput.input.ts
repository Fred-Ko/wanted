import { Field, ID, InputType, PartialType, PickType } from '@nestjs/graphql';
import { PaginationInput } from '@root/shared/interface/graphql/input/Pagenation.input';
import { Transform, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

@InputType()
export class Post {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id: number;

  @Field()
  title: string;

  @Field()
  author: string;

  @Field()
  content: string;
}

@InputType()
export class PostWhereInput extends PartialType(PickType(Post, ['title', 'author'] as const), InputType) {}

@InputType()
export class PostsQueryInput {
  @Field(() => PostWhereInput, { nullable: true })
  @ValidateNested()
  @Type(() => PostWhereInput)
  where?: PostWhereInput;

  @Field(() => PaginationInput)
  @ValidateNested()
  @Type(() => PaginationInput)
  pagination: PaginationInput;
}

@InputType()
export class PostQueryInput {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id: number;
}
