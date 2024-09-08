import { map, pipe, toArray, toAsync } from '@fxts/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { CreateCommentCommand, UpdatePostCommand } from '@root/post/domain/command';
import { PostService } from '@root/post/domain/Post.service';
import { CommentRepository, PostRepository } from '@root/post/domain/repository';
import { CommentRepositoryImpl } from '@root/post/infrastructure/Comment.repository.impl';
import { PostRepositoryImpl } from '@root/post/infrastructure/Post.repository.impl';
import { ErrorMessage } from '@root/shared/errors/error';
import { KafkaProducer } from '@root/shared/infrastructure/kafka/kafkaProducer';
import { PrismaService } from '@root/shared/infrastructure/prisma';
import createPrismaMock from 'prisma-mock';
import { createFakeCreateCommentCommand, createFakeCreatePostCommand, createFakeDeletePostCommand, createFakePostEntity } from './helper';

jest.mock('@root/shared/utils/password.util', () => ({
  verifyPassword: jest.fn().mockImplementation((inputPassword, storedPassword) => inputPassword === storedPassword),
  hashPassword: jest.fn().mockImplementation((inputPassword) => inputPassword),
}));

describe('PostService', () => {
  let postService: PostService;
  let prismaService: PrismaService;
  let kafkaProducer: KafkaProducer;
  let commentRepository: CommentRepository;
  let postRepository: PostRepository;
  let prismaClient;

  beforeEach(async () => {
    prismaClient = await createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PostService,
          useClass: PostService,
        },
        {
          provide: PrismaService,
          useValue: prismaClient,
        },
        {
          provide: KafkaProducer,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: 'CommentRepository',
          useClass: CommentRepositoryImpl,
        },
        {
          provide: 'PostRepository',
          useClass: PostRepositoryImpl,
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
    prismaService = module.get<PrismaService>(PrismaService);
    kafkaProducer = module.get(KafkaProducer);
    commentRepository = module.get<CommentRepository>('CommentRepository');
    postRepository = module.get<PostRepository>('PostRepository');
  });

  describe('findPaginatedPosts', () => {
    describe('성공 케이스', () => {
      it('기본 페이지네이션 입력값으로 첫 번째 페이지의 게시물을 가져온다', async () => {
        // Given
        const posts = [];
        Array.from({ length: 43 }).forEach((_, index) => {
          posts.push(
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          );
        });

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const first = 10;

        // When
        const result = await postService.findPaginatedPosts({ paginationInput: { first } });

        // Then
        expect(result.edges.length).toEqual(first);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPreviousPage).toBe(false);
        expect(result.pageInfo.startCursor).not.toBeNull();
        expect(result.pageInfo.endCursor).not.toBeNull();
      });

      it('두 번째 페이지의 게시물을 가져온다', async () => {
        // Given
        const posts = [];
        Array.from({ length: 25 }).forEach((_, index) => {
          posts.push(
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          );
        });

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const first = 10;
        const firstPageResult = await postService.findPaginatedPosts({ paginationInput: { first } });
        const after = firstPageResult.pageInfo.endCursor;

        // When
        const result = await postService.findPaginatedPosts({ paginationInput: { first, after } });

        // Then
        expect(result.edges.length).toEqual(10);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPreviousPage).toBe(true);
        expect(result.pageInfo.startCursor).not.toBeNull();
        expect(result.pageInfo.endCursor).not.toBeNull();
      });

      it('마지막 페이지의 게시물을 가져온다', async () => {
        // Given
        const posts = [];
        Array.from({ length: 15 }).forEach((_, index) => {
          posts.push(
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          );
        });

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const first = 10;
        const firstPageResult = await postService.findPaginatedPosts({ paginationInput: { first } });
        const after = firstPageResult.pageInfo.endCursor;
        //@ts-ignore
        const data = prismaService.getData();
        // When
        const result = await postService.findPaginatedPosts({ paginationInput: { first, after } });

        // Then
        expect(result.edges.length).toEqual(5);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.pageInfo.hasPreviousPage).toBe(true);
        expect(result.pageInfo.startCursor).not.toBeNull();
        expect(result.pageInfo.endCursor).not.toBeNull();
      });

      it('작성자 검색 조건으로 게시물을 필터링하여 가져온다', async () => {
        // Given
        const posts = [];
        posts.push(
          ...[
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          ],
        );

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const first = 10;
        // When
        const firstPageResult = await postService.findPaginatedPosts({
          paginationInput: { first },
          // searchCriteria,
        });

        const searchCriteria = {
          author: firstPageResult.edges[0].node.author,
        };

        const result = await postService.findPaginatedPosts({
          paginationInput: { first },
          searchCriteria,
        });

        // Then
        expect(result.edges.length).toEqual(1);
        expect(result.edges[0].node.author).toBe(searchCriteria.author);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.pageInfo.hasPreviousPage).toBe(false);
        expect(result.pageInfo.startCursor).not.toBeNull();
        expect(result.pageInfo.endCursor).not.toBeNull();
      });

      it('제목 검색 조건으로 게시물을 필터링하여 가져온다', async () => {
        // Given
        const posts = [];
        posts.push(
          ...[
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          ],
        );

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const first = 10;
        // When
        const firstPageResult = await postService.findPaginatedPosts({
          paginationInput: { first },
          // searchCriteria,
        });

        const result = await postService.findPaginatedPosts({
          paginationInput: { first },
          searchCriteria: {
            title: firstPageResult.edges[0].node.title,
          },
        });

        // Then
        expect(result.edges.length).toEqual(1);
        expect(result.edges[0].node.title).toBe(firstPageResult.edges[0].node.title);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.pageInfo.hasPreviousPage).toBe(false);
        expect(result.pageInfo.startCursor).not.toBeNull();
        expect(result.pageInfo.endCursor).not.toBeNull();
      });
    });

    describe('오류 케이스', () => {
      it('페이지 번호를 음수로 설정하여 요청한다', async () => {
        await expect(
          postService.findPaginatedPosts({
            paginationInput: { first: -1 },
          }),
        ).rejects.toThrow(ErrorMessage.INVALID_INPUT);
      });
    });
  });

  describe('findById', () => {
    describe('성공 케이스', () => {
      it('유효한 ID로 게시물을 성공적으로 조회한다', async () => {
        // Given
        const fakePost = createFakePostEntity();
        jest.spyOn(postRepository, 'findById').mockResolvedValue(fakePost);

        // When
        const result = await postService.findById(fakePost.id);

        // Then
        expect(result).toEqual(fakePost);
        expect(postRepository.findById).toHaveBeenCalledWith(fakePost.id);
      });
    });

    describe('오류 케이스', () => {
      it('존재하지 않는 ID로 게시물을 조회하려고 시도하여 POST_NOT_FOUND 오류를 발생시킨다', async () => {
        // Given
        const nonExistentId = 999;
        jest.spyOn(postRepository, 'findById').mockResolvedValue(null);

        // When & Then
        await expect(postService.findById(nonExistentId)).rejects.toThrow(ErrorMessage.POST_NOT_FOUND);
        expect(postRepository.findById).toHaveBeenCalledWith(nonExistentId);
      });

      it('ID 값에 null, undefined 또는 빈 문자열을 제공하여 조회를 시도한다', async () => {
        // Given
        const invalidIds = [null, undefined, ''];

        // When & Then
        for (const invalidId of invalidIds) {
          //@ts-expect-error
          await expect(postService.findById(invalidId)).rejects.toThrow();
        }
      });

      it('ID에 숫자가 아닌 값을 제공하여 조회를 시도한다', async () => {
        // Given
        const invalidId = 'not-a-number';

        // When & Then
        //@ts-expect-error
        await expect(postService.findById(invalidId)).rejects.toThrow();
      });
    });
  });

  describe('findManyPostDetailByIds', () => {
    describe('성공 케이스', () => {
      it('여러 유효한 ID로 게시물 상세 정보를 성공적으로 조회한다', async () => {
        // Given
        const posts = [];
        Array.from({ length: 3 }).forEach(() => {
          posts.push(
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          );
        });

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const createdPosts = await postService.findPaginatedPosts({ paginationInput: { first: 3 } });
        const ids = createdPosts.edges.map((edge) => edge.node.id);

        // When
        const result = await postService.findManyPostDetailByIds(ids);

        // Then
        expect(result).toHaveLength(3);
        result.forEach((postDetail) => {
          expect(postDetail).toHaveProperty('content');
        });
      });

      it('ID 배열에 중복된 ID를 포함하여 요청한다', async () => {
        // Given
        const posts = [];
        Array.from({ length: 2 }).forEach(() => {
          posts.push(
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          );
        });

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const createdPosts = await postService.findPaginatedPosts({ paginationInput: { first: 2 } });
        const ids = createdPosts.edges.map((edge) => edge.node.id);
        const duplicatedIds = [...ids, ids[0]];

        // When
        const result = await postService.findManyPostDetailByIds(duplicatedIds);

        // Then
        expect(result).toHaveLength(2);
        result.forEach((postDetail) => {
          expect(postDetail).toHaveProperty('content');
        });
      });

      it('ID 배열이 비어 있을 때 빈 배열을 반환한다', async () => {
        // Given
        const emptyIds = [];

        // When
        const result = await postService.findManyPostDetailByIds(emptyIds);

        // Then
        expect(result).toEqual([]);
      });

      it('ID 배열에 숫자가 아닌 값을 포함하여 요청한다', async () => {
        // Given
        const invalidIds = [1, 'not-a-number', 3];

        // When & Then
        //@ts-expect-error
        const result = await postService.findManyPostDetailByIds(invalidIds);
        expect(result).toEqual([]);
      });

      it('ID 배열에 null 또는 undefined 값을 포함하여 요청한다', async () => {
        // Given
        const invalidIds = [1, null, 3, undefined];

        // When & Then
        const result = await postService.findManyPostDetailByIds(invalidIds);
        expect(result).toEqual([]);
      });
    });

    describe('오류 케이스', () => {
      it('존재하지 않는 ID를 포함하여 요청한다(존재하는 게시물만 반환해야 함)', async () => {
        // Given
        const posts = [];
        Array.from({ length: 2 }).forEach(() => {
          posts.push(
            createFakePostEntity({
              id: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              postDetail: { postId: undefined },
            }),
          );
        });

        await pipe(
          posts,
          toAsync,
          map((post) => postService.createPost(post)),
          toArray,
        );

        const createdPosts = await postService.findPaginatedPosts({ paginationInput: { first: 2 } });
        const ids = createdPosts.edges.map((edge) => edge.node.id);
        const idsWithNonExistent = [...ids, 999];

        // When
        const result = await postService.findManyPostDetailByIds(idsWithNonExistent);

        // Then
        expect(result).toHaveLength(2);
        result.forEach((postDetail) => {
          expect(postDetail).toHaveProperty('content');
        });
      });
    });
  });

  describe('createPost', () => {
    describe('성공 케이스', () => {
      it('모든 필수 필드를 제공하여 게시물을 성공적으로 생성한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();

        // When
        const result = await postService.createPost(createPostCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('게시물이 성공적으로 생성되었습니다');
      });

      it('최대 길이의 문자열을 필드에 입력하여 게시물을 생성한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand({
          title: 'a'.repeat(255),
          author: 'a'.repeat(255),
          password: 'a'.repeat(255),
          postDetail: {
            content: 'a'.repeat(3000), // MySQL TEXT 타입의 최대 길이
          },
        });

        // When
        const result = await postService.createPost(createPostCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('게시물이 성공적으로 생성되었습니다');
      });
    });

    describe('오류 케이스', () => {
      it('필수 필드 중 하나 이상이 누락된 상태로 게시물을 생성하려고 시도한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        delete createPostCommand.title;

        // When & Then
        const result = await postService.createPost(createPostCommand);
        expect(result.success).toBe(false);
        expect(result.message).toContain('게시물 생성 중 오류가 발생했습니다');
      });

      it('제목이나 내용에 유효하지 않은 값을 제공한다(예: 너무 긴 문자열)', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand({
          title: 'a'.repeat(256),
        });

        // When & Then
        const result = await postService.createPost(createPostCommand);
        expect(result.success).toBe(false);
        expect(result.message).toContain('게시물 생성 중 오류가 발생했습니다');
      });
    });
  });

  describe('updatePost', () => {
    describe('성공 케이스', () => {
      it('유효한 ID와 비밀번호로 게시물을 성공적으로 업데이트한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);

        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;
        const password = createPostCommand.password;

        const updatePostCommand: UpdatePostCommand = {
          id: postId,
          password,
          title: '업데이트된 제목',
          author: '업데이트된 작성자',
          updatePostDetailCommand: {
            content: '업데이트된 내용',
          },
        };

        // When
        const result = await postService.updatePost(updatePostCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('게시물이 성공적으로 업데이트되었습니다');

        const updatedPost = await postService.findById(postId);
        expect(updatedPost.title).toBe(updatePostCommand.title);
        expect(updatedPost.author).toBe(updatePostCommand.author);
        expect(updatedPost.postDetail.content).toBe(updatePostCommand.updatePostDetailCommand.content);
      });

      it('일부 필드만 업데이트한다(예: 제목만 변경)', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        const createdPost = await postService.createPost(createPostCommand);
        const postId = parseInt(createdPost.message.split(': ')[1]);

        const updatePostCommand: UpdatePostCommand = {
          id: postId,
          password: createPostCommand.password,
          title: '새로운 제목',
        };

        // When
        const result = await postService.updatePost(updatePostCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('게시물이 성공적으로 업데이트되었습니다');

        const updatedPost = await postService.findById(postId);
        expect(updatedPost.title).toBe(updatePostCommand.title);
        expect(updatedPost.author).toBe(createPostCommand.author);
        expect(updatedPost.postDetail.content).toBe(createPostCommand.postDetail.content);
      });

      it('게시물 상세 내용(updatePostDetailCommand)을 함께 업데이트한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        const createdPost = await postService.createPost(createPostCommand);
        const postId = parseInt(createdPost.message.split(': ')[1]);

        const updatePostCommand: UpdatePostCommand = {
          id: postId,
          password: createPostCommand.password,
          updatePostDetailCommand: {
            content: '새로운 상세 내용',
          },
        };

        // When
        const result = await postService.updatePost(updatePostCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('게시물이 성공적으로 업데이트되었습니다');

        const updatedPost = await postService.findById(postId);
        expect(updatedPost.title).toBe(createPostCommand.title);
        expect(updatedPost.author).toBe(createPostCommand.author);
        expect(updatedPost.postDetail.content).toBe(updatePostCommand.updatePostDetailCommand.content);
      });
    });

    describe('오류 케이스', () => {
      it('존재하지 않는 ID로 게시물을 업데이트하려고 시도하여 POST_NOT_FOUND 오류를 발생시킨다', async () => {
        // Given
        const nonExistentId = 9999;
        const updatePostCommand: UpdatePostCommand = {
          id: nonExistentId,
          password: 'password123',
          title: '업데이트된 제목',
        };

        // When
        const result = await postService.updatePost(updatePostCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain(ErrorMessage.POST_NOT_FOUND);
      });

      it('잘못된 비밀번호로 업데이트를 시도하여 UNAUTHORIZED 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        const createdPost = await postService.createPost(createPostCommand);
        const postId = parseInt(createdPost.message.split(': ')[1]);

        const updatePostCommand: UpdatePostCommand = {
          id: postId,
          password: '잘못된_비밀번호',
          title: '업데이트된 제목',
        };

        // When
        const result = await postService.updatePost(updatePostCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain(ErrorMessage.UNAUTHORIZED);
      });

      it('ID나 비밀번호에 null 또는 undefined를 제공한다', async () => {
        // Given
        const invalidUpdateCommands: UpdatePostCommand[] = [
          { id: null, password: 'password123', title: '제목' },
          { id: 1, password: null, title: '제목' },
          { id: undefined, password: 'password123', title: '제목' },
          { id: 1, password: undefined, title: '제목' },
        ];

        // When & Then
        for (const invalidCommand of invalidUpdateCommands) {
          const result = await postService.updatePost(invalidCommand);
          expect(result.success).toBe(false);
          expect(result.message).toContain('게시물 업데이트 중 오류가 발생했습니다');
        }
      });

      it('업데이트할 데이터에 유효하지 않은 값을 제공한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        const createdPost = await postService.createPost(createPostCommand);
        const postId = parseInt(createdPost.message.split(': ')[1]);

        const invalidUpdateCommand: UpdatePostCommand = {
          id: postId,
          password: createPostCommand.password,
          title: 'a'.repeat(256), // 최대 길이 초과
        };

        // When
        const result = await postService.updatePost(invalidUpdateCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain('게시물 업데이트 중 오류가 발생했습니다');
      });
    });
  });

  describe('deletePost', () => {
    describe('성공 케이스', () => {
      it('유효한 ID와 비밀번호로 게시물을 성공적으로 삭제한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const deletePostCommand = createFakeDeletePostCommand({
          id: postId,
          password: createPostCommand.password,
        });

        // When
        const result = await postService.deletePost(deletePostCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('게시물이 성공적으로 삭제되었습니다');

        // 삭제된 게시물을 조회하려고 시도하면 오류가 발생해야 함
        await expect(postService.findById(postId)).rejects.toThrow(ErrorMessage.POST_NOT_FOUND);
      });
    });

    describe('오류 케이스', () => {
      it('존재하지 않는 ID로 게시물을 삭제하려고 시도하여 POST_NOT_FOUND 오류를 발생시킨다', async () => {
        // Given
        const nonExistentId = 9999;
        const deletePostCommand = createFakeDeletePostCommand({
          id: nonExistentId,
        });

        // When
        const result = await postService.deletePost(deletePostCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain(ErrorMessage.POST_NOT_FOUND);
      });

      it('잘못된 비밀번호로 삭제를 시도하여 UNAUTHORIZED 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        const createdPost = await postService.createPost(createPostCommand);
        const postId = parseInt(createdPost.message.split(': ')[1]);

        const deletePostCommand = createFakeDeletePostCommand({
          id: postId,
          password: '잘못된_비밀번호',
        });

        // When
        const result = await postService.deletePost(deletePostCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain(ErrorMessage.UNAUTHORIZED);
      });

      it('ID나 비밀번호에 null 또는 undefined를 제공한다', async () => {
        // Given
        const invalidDeleteCommands = [
          createFakeDeletePostCommand({ id: null }),
          createFakeDeletePostCommand({ password: null }),
          createFakeDeletePostCommand({ id: undefined }),
          createFakeDeletePostCommand({ password: undefined }),
        ];

        // When & Then
        for (const invalidCommand of invalidDeleteCommands) {
          const result = await postService.deletePost(invalidCommand);
          expect(result.success).toBe(false);
          expect(result.message).toContain('게시물 삭제 중 오류가 발생했습니다');
        }
      });
    });
  });

  describe('addComment', () => {
    describe('성공 케이스', () => {
      it('유효한 입력으로 댓글을 성공적으로 생성한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const createCommentCommand: CreateCommentCommand = {
          postId,
          content: '테스트 댓글입니다.',
          author: '테스트 작성자',
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('댓글이 성공적으로 생성되었습니다');

        const comments = await postService.findPaginatedCommentsByPostId(postId, { first: 1 });
        expect(comments.edges).toHaveLength(1);
        expect(comments.edges[0].node.content).toBe(createCommentCommand.content);
        expect(comments.edges[0].node.author).toBe(createCommentCommand.author);
      });

      it('부모 댓글 ID가 제공된 경우 대댓글을 성공적으로 생성한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const parentCommentCommand: CreateCommentCommand = {
          postId,
          content: '부모 댓글입니다.',
          author: '부모 작성자',
        };
        const parentCommentResult = await postService.addComment(parentCommentCommand);
        const parentId = parseInt(parentCommentResult.message.split(': ')[1]);

        const childCommentCommand: CreateCommentCommand = {
          postId,
          content: '대댓글입니다.',
          author: '대댓글 작성자',
          parentId: parentId,
        };

        // When
        const result = await postService.addComment(childCommentCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('댓글이 성공적으로 생성되었습니다');

        const comments = await postService.findPaginatedCommentsByPostId(postId, { first: 2 });
        expect(comments.edges).toHaveLength(2);
        expect(comments.edges[1].node.content).toBe(childCommentCommand.content);
        expect(comments.edges[1].node.author).toBe(childCommentCommand.author);
        expect(comments.edges[1].node.parentId).toBe(parentId);
      });

      it('최대 길이의 댓글 내용으로 댓글을 성공적으로 생성한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const maxLengthContent = 'a'.repeat(3000);
        const createCommentCommand: CreateCommentCommand = {
          postId,
          content: maxLengthContent,
          author: '테스트 작성자',
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(true);
        expect(result.message).toContain('댓글이 성공적으로 생성되었습니다');

        const comments = await postService.findPaginatedCommentsByPostId(postId, { first: 1 });
        expect(comments.edges).toHaveLength(1);
        expect(comments.edges[0].node.content).toBe(maxLengthContent);
        expect(comments.edges[0].node.content.length).toBe(3000);
      });
    });

    describe('오류 케이스', () => {
      it('존재하지 않는 게시물에 댓글을 추가하려고 시도하여 오류를 발생시킨다', async () => {
        // Given
        const nonExistentPostId = 9999;
        const createCommentCommand: CreateCommentCommand = {
          postId: nonExistentPostId,
          content: '테스트 댓글입니다.',
          author: '테스트 작성자',
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain(ErrorMessage.POST_NOT_FOUND);
      });

      it('유효하지 않은 입력으로 댓글 생성을 시도하여 INVALID_INPUT 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const invalidCreateCommentCommand: CreateCommentCommand = {
          postId,
          content: '',
          author: '',
        };

        // When
        const result = await postService.addComment(invalidCreateCommentCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain('댓글 생성 중 오류가 발생했습니다');
      });

      it('댓글 내용이 없는 경우 INVALID_INPUT 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const createCommentCommand: CreateCommentCommand = {
          postId,
          content: '',
          author: '테스트 작성자',
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain('댓글 생성 중 오류가 발생했습니다');
      });

      it('작성자 이름이 없는 경우 INVALID_INPUT 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const createCommentCommand: CreateCommentCommand = {
          postId,
          content: '테스트 댓글입니다.',
          author: '',
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain('댓글 생성 중 오류가 발생했습니다');
      });

      it('댓글 내용이 최대 길이를 초과하는 경우 INVALID_INPUT 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const createCommentCommand: CreateCommentCommand = {
          postId,
          content: 'a'.repeat(3001),
          author: '테스트 작성자',
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain('댓글 생성 중 오류가 발생했습니다');
      });

      it('존재하지 않는 부모 댓글 ID로 대댓글을 생성하려고 시도하여 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const nonExistentParentCommentId = 9999;
        const createCommentCommand: CreateCommentCommand = {
          postId,
          content: '대댓글입니다.',
          author: '테스트 작성자',
          parentId: nonExistentParentCommentId,
        };

        // When
        const result = await postService.addComment(createCommentCommand);

        // Then
        expect(result.success).toBe(false);
        expect(result.message).toContain(ErrorMessage.COMMENT_NOT_FOUND);
      });
    });
  });

  describe('findPaginatedCommentsByPostId', () => {
    describe('성공 케이스', () => {
      it('유효한 게시물 ID로 페이지네이션된 댓글 목록을 가져온다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const commentCount = 5;
        for (let i = 0; i < commentCount; i++) {
          const createCommentCommand = createFakeCreateCommentCommand({ postId, parentId: null });
          await postService.addComment(createCommentCommand);
        }

        // When
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 3 });

        // Then
        expect(result.edges).toHaveLength(3);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPreviousPage).toBe(false);
      });

      it('빈 댓글 목록을 가진 게시물에 대해 빈 결과를 반환한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        // When
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 10 });

        // Then
        expect(result.edges).toHaveLength(0);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.edges.length).toBe(0);
      });

      it('첫 번째 페이지의 댓글을 성공적으로 가져온다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const commentCount = 10;
        for (let i = 0; i < commentCount; i++) {
          const createCommentCommand = createFakeCreateCommentCommand({ postId, parentId: null });
          await postService.addComment(createCommentCommand);
        }

        // When
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 5 });

        // Then
        expect(result.edges).toHaveLength(5);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPreviousPage).toBe(false);
      });

      it('두 번째 페이지의 댓글을 성공적으로 가져온다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const commentCount = 11;
        for (let i = 0; i < commentCount; i++) {
          const createCommentCommand = createFakeCreateCommentCommand({ postId, parentId: null });
          await postService.addComment(createCommentCommand);
        }

        const firstPage = await postService.findPaginatedCommentsByPostId(postId, { first: 5 });
        const lastCursor = firstPage.pageInfo.endCursor;

        // When
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 5, after: lastCursor });

        // Then
        expect(result.edges).toHaveLength(5);
        expect(result.pageInfo.hasNextPage).toBe(true);
        expect(result.pageInfo.hasPreviousPage).toBe(true);
      });

      it('마지막 페이지의 댓글을 성공적으로 가져온다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const commentCount = 12;
        for (let i = 0; i < commentCount; i++) {
          const createCommentCommand = createFakeCreateCommentCommand({ postId, parentId: null });
          await postService.addComment(createCommentCommand);
        }

        const firstPage = await postService.findPaginatedCommentsByPostId(postId, { first: 10 });
        const lastCursor = firstPage.pageInfo.endCursor;

        // When
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 5, after: lastCursor });

        // Then
        expect(result.edges).toHaveLength(2);
        expect(result.pageInfo.hasNextPage).toBe(false);
        expect(result.pageInfo.hasPreviousPage).toBe(true);
      });

      it('대댓글을 포함한 댓글 목록을 올바르게 가져온다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        const parentCommentCommand = createFakeCreateCommentCommand({ postId, parentId: null });
        await postService.addComment(parentCommentCommand);

        const parentComments = await postService.findPaginatedCommentsByPostId(postId, { first: 1 });
        const parentId = parentComments.edges[0].node.id; // 수정된 부분

        const childCommentCommand = createFakeCreateCommentCommand({ postId, parentId: parentId });
        await postService.addComment(childCommentCommand);

        // When
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 10 });

        // Then
        expect(result.edges).toHaveLength(2);
        expect(result.edges[0].node.id).toBe(parentId);
        expect(result.edges[0].node.parentId).toBe(null);
        expect(result.edges[0].node.postId).toBe(postId);
        expect(result.edges[1].node.parentId).toBe(parentId);
        expect(result.edges[1].node.postId).toBe(postId);
        expect(result.edges.length).toBe(2);
      });
    });

    describe('오류 케이스', () => {
      it('존재하지 않는 게시물 ID로 댓글을 조회하려고 시도하여 오류를 발생시킨다', async () => {
        // Given
        const nonExistentPostId = 9999;

        // When & Then
        await expect(postService.findPaginatedCommentsByPostId(nonExistentPostId, { first: 10 })).rejects.toThrow(
          ErrorMessage.POST_NOT_FOUND,
        );
      });

      it('유효하지 않은 페이지네이션 입력으로 조회를 시도하여 INVALID_INPUT 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        // When & Then
        await expect(postService.findPaginatedCommentsByPostId(postId, { first: -1 })).rejects.toThrow(ErrorMessage.INVALID_INPUT);
      });

      it('음수 값의 first 파라미터로 조회를 시도하여 INVALID_INPUT 오류를 발생시킨다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        // When & Then
        await expect(postService.findPaginatedCommentsByPostId(postId, { first: -5 })).rejects.toThrow(ErrorMessage.INVALID_INPUT);
      });

      it('유효하지 않은 커서 값으로 조회를 시도 빈배열을 반환한다', async () => {
        // Given
        const createPostCommand = createFakeCreatePostCommand();
        await postService.createPost(createPostCommand);
        const createdPost = await postService.findPaginatedPosts({ paginationInput: { first: 1 } });
        const postId = createdPost.edges[0].node.id;

        // When & Then
        const result = await postService.findPaginatedCommentsByPostId(postId, { first: 10, after: 'invalid_cursor' });
        expect(result.edges).toHaveLength(0);
      });
    });
  });
});
