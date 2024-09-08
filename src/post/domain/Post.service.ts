import { Inject, Injectable, Logger } from '@nestjs/common';

import { map, pipe, toArray, toAsync } from '@fxts/core';
import type { CreatePostCommand, DeletePostCommand, UpdatePostCommand } from '@root/post/domain/command';
import type { CreateCommentCommand } from '@root/post/domain/command/CreateComment.command';

import { PostCreatedEvent, PostUpdatedEvent } from '@root/post/domain/events';

import type { CommentRepository, PostRepository } from '@root/post/domain/repository';
import type { LimitedPostWhereInput } from '@root/post/infrastructure/types/post.type';
import type { MutationResultPayload } from '@root/post/shared/interface/graphql/payload/MutationResult.payload';
import { CustomError, ErrorCode, ErrorMessage } from '@root/shared/errors/error';
import { KafkaProducer } from '@root/shared/infrastructure/kafka/kafkaProducer';
import { PrismaService } from '@root/shared/infrastructure/prisma';
import type { CursorPaginationInput, PaginatedResult } from '@root/shared/types/Pagenation.interface';
import { hashPassword, verifyPassword } from '@root/shared/utils/password.util';
import { plainToInstance } from 'class-transformer';

import { PostDetailVO, type CommentEntity, type PostEntity } from '@root/generated';
import {
  createCommentCommandSchema,
  createPostCommandSchema,
  deletePostCommandSchema,
  updatePostCommandSchema,
} from '@root/post/domain/command';

@Injectable()
export class PostService {
  private events = [];

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(KafkaProducer) private readonly kafkaProducer: KafkaProducer,
    @Inject('CommentRepository') private readonly commentRepository: CommentRepository,
    @Inject('PostRepository') private readonly postRepository: PostRepository,
  ) {}

  async findPaginatedPosts(param: {
    paginationInput: CursorPaginationInput;
    searchCriteria?: LimitedPostWhereInput;
  }): Promise<PaginatedResult<PostEntity>> {
    const posts = await this.postRepository.findAll({
      paginationInput: param.paginationInput,
      searchCriteria: param.searchCriteria,
    });

    return posts;
  }

  async findById(id: PostEntity['id']): Promise<PostEntity> {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new CustomError(ErrorCode.POST_NOT_FOUND, ErrorMessage.POST_NOT_FOUND);
    }

    return post;
  }

  async findManyPostDetailByIds(ids: PostEntity['id'][]): Promise<PostDetailVO[]> {
    const posts = await this.postRepository.findByIds(ids);
    return plainToInstance(
      PostDetailVO,
      posts.map((post) => post.postDetail),
    );
  }

  async findPaginatedCommentsByPostId(
    postId: PostEntity['id'],
    paginationInput?: CursorPaginationInput,
  ): Promise<PaginatedResult<CommentEntity>> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new CustomError(ErrorCode.POST_NOT_FOUND, ErrorMessage.POST_NOT_FOUND);
    }
    return await this.commentRepository.findManyByPostId(postId, paginationInput);
  }

  async createPost(input: CreatePostCommand): Promise<MutationResultPayload<PostEntity>> {
    try {
      const { error } = createPostCommandSchema.validate(input);
      if (error) {
        throw new CustomError(ErrorCode.INVALID_INPUT, error.details[0].message);
      }

      const { postDetail: postDetailPart, password, ...postPart } = input;
      const hashedPassword = hashPassword(password);
      const newPost = {
        ...postPart,
        password: hashedPassword,
        postDetail: postDetailPart,
      };

      const createdPost = await this.prisma.$transaction(async (tx) => {
        const post = await this.postRepository.create(newPost, tx);
        this.events.push(new PostCreatedEvent(post.id.toString(), post.title, post.author, post.postDetail.content, post.createdAt));
        return post;
      });

      await pipe(
        this.events,
        toAsync,
        map((event) => this.kafkaProducer.publish(event.constructor.name, event)),
        toArray,
        () => {
          this.events = [];
        },
      );

      return {
        success: true,
        message: `게시물이 성공적으로 생성되었습니다. ID: ${createdPost.id}`,
        data: createdPost,
      };
    } catch (error) {
      Logger.error(error);
      return {
        success: false,
        message: `게시물 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  async addComment(input: CreateCommentCommand): Promise<MutationResultPayload<CommentEntity>> {
    try {
      const { error } = createCommentCommandSchema.validate(input);
      if (error) {
        throw new CustomError(ErrorCode.INVALID_INPUT, error.details[0].message);
      }

      const { postId, content, parentId, author } = input;

      const post = await this.postRepository.findById(postId);
      if (!post) {
        throw new CustomError(ErrorCode.POST_NOT_FOUND, ErrorMessage.POST_NOT_FOUND);
      }

      if (parentId) {
        const parentComment = parentId ? await this.commentRepository.findById(parentId) : null;
        if (!parentComment || parentComment?.postId !== postId) {
          throw new CustomError(ErrorCode.COMMENT_NOT_FOUND, ErrorMessage.COMMENT_NOT_FOUND);
        }
      }

      const comment = await this.commentRepository.create({
        author,
        content,
        post: { connect: { id: postId } },
        parentComment: parentId ? { connect: { id: parentId } } : undefined,
      });

      return {
        success: true,
        message: `댓글이 성공적으로 생성되었습니다. ID: ${comment.id}`,
        data: comment,
      };
    } catch (error) {
      Logger.error(error);
      return {
        success: false,
        message: `댓글 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  async updatePost(input: UpdatePostCommand): Promise<MutationResultPayload<PostEntity>> {
    try {
      const { error } = updatePostCommandSchema.validate(input);
      if (error) {
        throw new CustomError(ErrorCode.INVALID_INPUT, error.details[0].message);
      }

      const { id, password, author, title, updatePostDetailCommand: updatePostDetailDto } = input;
      const updatedPost = await this.prisma.$transaction(async (tx) => {
        const post = await this.postRepository.findById(id, tx);

        if (!post) {
          throw new CustomError(ErrorCode.POST_NOT_FOUND, ErrorMessage.POST_NOT_FOUND);
        }

        const isPasswordValid = verifyPassword(password, post.password);
        if (!isPasswordValid) {
          throw new CustomError(ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
        }

        const updatedPostData = {
          title,
          author,
          postDetail: updatePostDetailDto ? { update: { content: updatePostDetailDto.content } } : undefined,
        };

        const newPost = await this.postRepository.update(id, updatedPostData, tx);

        this.events.push(
          new PostUpdatedEvent(newPost.id.toString(), newPost.title, newPost.author, newPost.updatedAt, newPost.postDetail?.content),
        );

        return newPost;
      });

      await pipe(
        this.events,
        toAsync,
        map((event) => this.kafkaProducer.publish(event.constructor.name, event)),
        toArray,
        () => {
          this.events = [];
        },
      );

      return {
        success: true,
        message: `게시물이 성공적으로 업데이트되었습니다. ID: ${updatedPost.id}`,
        data: updatedPost,
      };
    } catch (error) {
      Logger.error(error);
      return {
        success: false,
        message: `게시물 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  async deletePost(input: DeletePostCommand): Promise<MutationResultPayload<PostEntity>> {
    try {
      const { error } = deletePostCommandSchema.validate(input);
      if (error) {
        throw new CustomError(ErrorCode.INVALID_INPUT, error.details[0].message);
      }

      const { id, password } = input;
      await this.prisma.$transaction(async (tx) => {
        const post = await this.postRepository.findById(id, tx);

        if (!post) {
          throw new CustomError(ErrorCode.POST_NOT_FOUND, ErrorMessage.POST_NOT_FOUND);
        }

        const isPasswordValid = verifyPassword(password, post.password);
        if (!isPasswordValid) {
          throw new CustomError(ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
        }

        await this.postRepository.deleteById(id, tx);
      });

      return {
        success: true,
        message: `게시물이 성공적으로 삭제되었습니다. ID: ${input.id}`,
      };
    } catch (error) {
      Logger.error(error);
      return {
        success: false,
        message: `게시물 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }
}
