import { Inject } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { CommentEntity } from '@root/generated';
import { PostService } from '@root/post/domain/Post.service';
import { CreateCommentInput } from '@root/post/interface/graphql/input/CreateComment.input';
import { CreatePostInput } from '@root/post/interface/graphql/input/CreatePostInput.input';
import { DeletePostInput } from '@root/post/interface/graphql/input/DeletePostInput.input';
import { PostQueryInput, PostsQueryInput } from '@root/post/interface/graphql/input/PostQueryInput.input';
import { UpdatePostInput } from '@root/post/interface/graphql/input/UpdatePostInput.input';
import { Comment } from '@root/post/shared/interface/graphql/type/Comment.type';
import { CommentConnection } from '@root/post/shared/interface/graphql/type/CommentConnection.type';
import { CommentEdge } from '@root/post/shared/interface/graphql/type/CommentEdge.type';
import { Post } from '@root/post/shared/interface/graphql/type/Post.type';
import { PostConnection } from '@root/post/shared/interface/graphql/type/PostConnection.type';
import { PostDetail } from '@root/post/shared/interface/graphql/type/PostDetail.type';
import { PaginationInput } from '@root/shared/interface/graphql/input/Pagenation.input';
import {
  CommentMutationResult,
  MutationResult,
  PostMutationResult,
  Void,
  VoidMutationResult,
} from '@root/shared/interface/graphql/type/MutationResult.type';
import { PaginatedResult } from '@root/shared/types/Pagenation.interface';
import { plainToInstance } from 'class-transformer';
import * as DataLoader from 'dataloader';

@Resolver(() => Post)
export class PostResolver {
  private readonly postDetailLoader: DataLoader<number, PostDetail>;
  private readonly commentLoader: DataLoader<{ postId: number; paginationInput: PaginationInput }, PaginatedResult<Comment>>;

  constructor(@Inject(PostService) private readonly postService: PostService) {
    this.postDetailLoader = new DataLoader<number, PostDetail>(
      async (postIds: readonly number[]) => {
        const postDetails = await this.postService.findManyPostDetailByIds(postIds as number[]);
        return postIds.map((id) => {
          const detail = postDetails.find((detail) => detail.postId === id);
          return plainToInstance(PostDetail, detail);
        });
      },
      { cache: false },
    );

    this.commentLoader = new DataLoader<{ postId: number; paginationInput: PaginationInput }, PaginatedResult<Comment>>(
      async (keys) => {
        const results = await Promise.all(
          keys.map(({ postId, paginationInput }) => this.postService.findPaginatedCommentsByPostId(postId, paginationInput)),
        );
        return keys.map((key) => {
          const result =
            results.find((r) => r.edges[0]?.node.postId === key.postId) || ({ edges: [], pageInfo: {} } as PaginatedResult<CommentEntity>);
          return {
            edges: result.edges.map((edge) => ({
              node: plainToInstance(Comment, edge.node),
              cursor: edge.cursor,
            })),
            pageInfo: result.pageInfo,
          };
        });
      },
      { cache: false },
    );
  }

  @Query(() => Post)
  async post(@Args('input', { type: () => PostQueryInput }) input: PostQueryInput): Promise<Post> {
    const postEntity = await this.postService.findById(input.id);

    return plainToInstance(Post, postEntity);
  }

  @Query(() => PostConnection)
  async posts(@Args('input', { type: () => PostsQueryInput }) input: PostsQueryInput): Promise<PostConnection> {
    const searchCriteria = input.where ?? {};

    const postEntities = await this.postService.findPaginatedPosts({
      paginationInput: {
        first: input.pagination.first,
        after: input.pagination.after,
      },
      searchCriteria,
    });

    return {
      edges: postEntities.edges.map(({ node, cursor }) => ({
        node: plainToInstance(Post, node),
        cursor,
      })),
      pageInfo: postEntities.pageInfo,
    };
  }

  @ResolveField(() => PostDetail)
  async postDetail(@Parent() post: Post): Promise<PostDetail> {
    return this.postDetailLoader.load(post.id);
  }

  @ResolveField(() => CommentConnection, { nullable: true })
  async comments(
    @Parent() post: Post,
    @Args('paginationInput', { type: () => PaginationInput }) paginationInput: PaginationInput,
  ): Promise<CommentConnection> {
    const result = await this.commentLoader.load({ postId: post.id, paginationInput });
    if (result.edges.length === 0) return null;

    return {
      edges: result.edges.map(({ node, cursor }) =>
        plainToInstance(CommentEdge, {
          node: plainToInstance(Comment, node),
          cursor,
        }),
      ),
      pageInfo: result.pageInfo,
    };
  }

  @Mutation(() => PostMutationResult)
  async createPost(@Args('input', { type: () => CreatePostInput }) input: CreatePostInput): Promise<MutationResult<Post>> {
    const result = await this.postService.createPost(input);
    return new PostMutationResult(result.success, result.message, plainToInstance(Post, result.data));
  }

  @Mutation(() => PostMutationResult)
  async updatePost(@Args('input', { type: () => UpdatePostInput }) input: UpdatePostInput): Promise<MutationResult<Post>> {
    const { content, ...rest } = input;
    const result = await this.postService.updatePost({
      ...rest,
      updatePostDetailCommand: {
        content,
      },
    });
    return new PostMutationResult(result.success, result.message, plainToInstance(Post, result.data));
  }

  @Mutation(() => VoidMutationResult)
  async deletePost(@Args('input', { type: () => DeletePostInput }) input: DeletePostInput): Promise<MutationResult<Void>> {
    const result = await this.postService.deletePost(input);
    return new VoidMutationResult(result.success, result.message);
  }

  @Mutation(() => CommentMutationResult)
  async createComment(@Args('input', { type: () => CreateCommentInput }) input: CreateCommentInput): Promise<MutationResult<Comment>> {
    const result = await this.postService.addComment(input);
    return new CommentMutationResult(result.success, result.message, plainToInstance(Comment, result.data));
  }
}
