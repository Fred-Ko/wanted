import type { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { Comment } from '@root/post/shared/interface/graphql/type/Comment.type';
import { Post } from '@root/post/shared/interface/graphql/type/Post.type';

export function createMutationResultType<T>(classRef: Type<T>, name: string): Type<MutationResult<T>> {
  @ObjectType(`${name}MutationResult`)
  class MutationResultClass implements MutationResult<T> {
    @Field(() => Boolean)
    public readonly success: boolean;

    @Field(() => String, { nullable: true })
    public readonly message?: string;

    @Field(() => String, { nullable: true })
    public readonly errorCode?: string;

    @Field(() => classRef, { nullable: true })
    public readonly data?: T;

    constructor(success: boolean, message?: string, data?: T, errorCode?: string) {
      this.success = success;
      this.message = message;
      this.data = data;
      this.errorCode = errorCode;
    }
  }

  return MutationResultClass as Type<MutationResult<T>>;
}

export interface MutationResult<T> {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: T;
}

@ObjectType()
export class Void {
  @Field(() => Boolean, { nullable: true })
  _?: boolean;
}

export const PostMutationResult = createMutationResultType(Post, 'Post');
export const CommentMutationResult = createMutationResultType(Comment, 'Comment');
export const VoidMutationResult = createMutationResultType(Void, 'Void');
