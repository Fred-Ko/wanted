import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@root/app.module';
import { PrismaService } from '@root/shared/infrastructure/prisma';
import createPrismaMock from 'prisma-mock';
import * as request from 'supertest';

jest.mock('@root/shared/infrastructure/kafka/kafkaProducer', () => ({
  KafkaProducer: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@root/shared/infrastructure/kafka/kafkaConsumer', () => ({
  KafkaConsumer: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('PostResolver (e2e)', () => {
  let app: INestApplication;
  let prismaClient;

  beforeAll(async () => {
    prismaClient = await createPrismaMock();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('게시물 조작', () => {
    it('게시물을 생성하고, 조회하고, 수정하고, 삭제할 수 있어야 한다', async () => {
      // 게시물 생성
      const createMutation = `
        mutation {
          createPost(input: {
            title: "테스트 게시물",
            author: "테스트 작성자",
            postDetail: { content: "테스트 내용" },
            password: "1234"
          }) {
            success
            message
            data {
              id
              title
              author
            }
          }
        }
      `;

      const createResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createMutation }).expect(200);

      expect(createResponse.body.data.createPost.success).toBe(true);
      expect(createResponse.body.data.createPost.message).toContain('게시물이 성공적으로 생성되었습니다.');
      const createdPostId = createResponse.body.data.createPost.data.id;

      // 생성된 게시물 조회
      const postQuery = `
        query {
          post(input: { id: ${createdPostId} }) {
            id
            title
            author
            postDetail {
              content
            }
          }
        }
      `;

      const postResponse = await request(app.getHttpServer()).post('/graphql').send({ query: postQuery }).expect(200);

      const queriedPost = postResponse.body.data.post;
      expect(queriedPost.title).toBe('테스트 게시물');
      expect(queriedPost.author).toBe('테스트 작성자');
      expect(queriedPost.postDetail.content).toBe('테스트 내용');

      // 게시물 수정
      const updateMutation = `
        mutation {
          updatePost(input: {
            id: ${createdPostId},
            title: "수정된 제목",
            content: "수정된 내용",
            password: "1234"
          }) {
            success
            message
            data {
              id
              title
              author
              postDetail {
                content
              }
            }
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer()).post('/graphql').send({ query: updateMutation }).expect(200);

      expect(updateResponse.body.data.updatePost.success).toBe(true);
      expect(updateResponse.body.data.updatePost.message).toContain('게시물이 성공적으로 업데이트되었습니다.');
      expect(updateResponse.body.data.updatePost.data.title).toBe('수정된 제목');
      expect(updateResponse.body.data.updatePost.data.postDetail.content).toBe('수정된 내용');

      // 게시물 삭제
      const deleteMutation = `
        mutation {
          deletePost(input: {
            id: ${createdPostId},
            password: "1234"
          }) {
            success
            message
          }
        }
      `;

      const deleteResponse = await request(app.getHttpServer()).post('/graphql').send({ query: deleteMutation }).expect(200);

      expect(deleteResponse.body.data.deletePost.success).toBe(true);
      expect(deleteResponse.body.data.deletePost.message).toContain('게시물이 성공적으로 삭제되었습니다.');

      // 삭제된 게시물 조회 시도
      const deletedPostResponse = await request(app.getHttpServer()).post('/graphql').send({ query: postQuery }).expect(200);

      expect(deletedPostResponse.body.errors).toBeDefined();
      expect(deletedPostResponse.body.errors[0].message).toContain('Post not found');
    });

    it('잘못된 비밀번호로 게시물을 수정하려고 하면 실패해야 한다', async () => {
      // 게시물 생성
      const createMutation = `
        mutation {
          createPost(input: {
            title: "비밀번호 테스트 게시물",
            author: "테스트 작성자",
            postDetail: { content: "테스트 내용" },
            password: "correctPassword"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const createResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createMutation }).expect(200);
      const createdPostId = createResponse.body.data.createPost.data.id;

      // 잘못된 비밀번호로 게시물 수정 시도
      const updateMutation = `
        mutation {
          updatePost(input: {
            id: ${createdPostId},
            title: "수정된 제목",
            content: "수정된 내용",
            password: "wrongPassword"
          }) {
            success
            message
          }
        }
      `;

      const updateResponse = await request(app.getHttpServer()).post('/graphql').send({ query: updateMutation }).expect(200);

      expect(updateResponse.body.data.updatePost.success).toBe(false);
      expect(updateResponse.body.data.updatePost.message).toBe('게시물 업데이트 중 오류가 발생했습니다: Unauthorized');

      // 게시물 삭제 (정리)
      const deleteMutation = `
        mutation {
          deletePost(input: {
            id: ${createdPostId},
            password: "correctPassword"
          }) {
            success
            message
          }
        }
      `;

      await request(app.getHttpServer()).post('/graphql').send({ query: deleteMutation }).expect(200);
    });
  });

  describe('댓글 조작', () => {
    it('댓글을 생성하고 조회할 수 있어야 한다', async () => {
      // 게시물 생성
      const createPostMutation = `
        mutation {
          createPost(input: {
            title: "댓글 테스트용 게시물",
            author: "테스트 작성자",
            postDetail: { content: "테스트 내용" },
            password: "1234"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const createPostResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createPostMutation }).expect(200);
      const postId = createPostResponse.body.data.createPost.data.id;

      // 댓글 생성
      const createCommentMutation = `
        mutation {
          createComment(input: {
            postId: "${postId}",
            content: "테스트 댓글",
            author: "댓글 작성자"
          }) {
            success
            message
            errorCode
            data {
              content
              author
              createdAt
            }
          }
        }
    `;

      const createCommentResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createCommentMutation }).expect(200);

      expect(createCommentResponse.body.data.createComment.success).toBe(true);
      expect(createCommentResponse.body.data.createComment.message).toContain('댓글이 성공적으로 생성되었습니다.');

      // 댓글 조회
      const commentsQuery = `
        query {
          post(input: { id: ${postId} }) {
            comments(paginationInput: { first: 10 }) {
              edges {
                node {
                  content
                  author
                }
              }
            }
          }
        }
      `;

      const commentsResponse = await request(app.getHttpServer()).post('/graphql').send({ query: commentsQuery }).expect(200);

      const comments = commentsResponse.body.data.post.comments.edges;
      expect(comments).toHaveLength(1);
      expect(comments[0].node.content).toBe('테스트 댓글');
      expect(comments[0].node.author).toBe('댓글 작성자');

      // 게시물 삭제 (정리)
      const deletePostMutation = `
        mutation {
          deletePost(input: {
            id: ${postId},
            password: "1234"
          }) {
            success
            message
          }
        }
      `;

      await request(app.getHttpServer()).post('/graphql').send({ query: deletePostMutation }).expect(200);
    });

    it('대댓글을 생성하고 조회할 수 있어야 한다', async () => {
      // 게시물 생성
      const createPostMutation = `
        mutation {
          createPost(input: {
            title: "대댓글 테스트용 게시물",
            author: "테스트 작성자",
            postDetail: { content: "테스트 내용" },
            password: "1234"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const createPostResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createPostMutation }).expect(200);
      const postId = createPostResponse.body.data.createPost.data.id;

      // 부모 댓글 생성
      const createParentCommentMutation = `
        mutation {
          createComment(input: {
            postId: ${postId},
            content: "부모 댓글",
            author: "부모 댓글 작성자"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const createParentCommentResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createParentCommentMutation })
        .expect(200);

      const parentId = createParentCommentResponse.body.data.createComment.data.id;

      // 대댓글 생성
      const createReplyMutation = `
        mutation {
          createComment(input: {
            postId: ${postId},
            content: "대댓글",
            author: "대댓글 작성자",
            parentId: ${parentId}
          }) {
            success
            message
            data {
              id
              content
              author
              parentId
            }
          }
        }
      `;

      const createReplyResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createReplyMutation }).expect(200);

      expect(createReplyResponse.body.data.createComment.success).toBe(true);
      expect(createReplyResponse.body.data.createComment.message).toContain('댓글이 성공적으로 생성되었습니다.');
      expect(createReplyResponse.body.data.createComment.data.parentId).toBe(parentId);

      // 모든 댓글 조회
      const allCommentsQuery = `
        query {
          post(input: { id: ${postId} }) {
            comments(paginationInput: { first: 10 }) {
              edges {
                node {
                  id
                  content
                  author
                  parentId
                }
              }
            }
          }
        }
      `;

      const allCommentsResponse = await request(app.getHttpServer()).post('/graphql').send({ query: allCommentsQuery }).expect(200);

      const allComments = allCommentsResponse.body.data.post.comments.edges;
      expect(allComments).toHaveLength(2);
      expect(allComments[0].node.content).toBe('부모 댓글');
      expect(allComments[0].node.author).toBe('부모 댓글 작성자');
      expect(allComments[0].node.parentId).toBeNull();
      expect(allComments[1].node.content).toBe('대댓글');
      expect(allComments[1].node.author).toBe('대댓글 작성자');
      expect(allComments[1].node.parentId).toBe(parentId);

      // 게시물 삭제 (정리)
      const deletePostMutation = `
        mutation {
          deletePost(input: {
            id: ${postId},
            password: "1234"
          }) {
            success
            message
          }
        }
      `;

      await request(app.getHttpServer()).post('/graphql').send({ query: deletePostMutation }).expect(200);
    });
  });

  describe('게시물 검색', () => {
    it('제목으로 게시물을 검색할 수 있어야 한다', async () => {
      // 게시물 생성
      const createPostMutation = `
        mutation {
          createPost(input: {
            title: "검색 테스트용 게시물",
            author: "테스트 작성자",
            postDetail: { content: "테스트 내용" },
            password: "1234"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const createPostResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createPostMutation }).expect(200);
      const postId = createPostResponse.body.data.createPost.data.id;

      // 게시물 검색
      const searchQuery = `
        query {
          posts(input: { 
            where: { title: "검색 테스트용 게시물", author: "테스트 작성자" },
            pagination: { first: 10 }
          }) {
            edges {
              node {
                id
                title
                author
              }
            }
          }
        }
      `;

      const searchResponse = await request(app.getHttpServer()).post('/graphql').send({ query: searchQuery }).expect(200);

      const searchResults = searchResponse.body.data.posts.edges;
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].node.title).toBe('검색 테스트용 게시물');
      expect(searchResults[0].node.author).toBe('테스트 작성자');

      // 게시물 삭제 (정리)
      const deletePostMutation = `
        mutation {
          deletePost(input: {
            id: ${postId},
            password: "1234"
          }) {
            success
            message
          }
        }
      `;

      await request(app.getHttpServer()).post('/graphql').send({ query: deletePostMutation }).expect(200);
    });

    it('작성자로 게시물을 검색할 수 있어야 한다', async () => {
      // 게시물 생성
      const createPostMutation = `
        mutation {
          createPost(input: {
            title: "작성자 검색 테스트용 게시물",
            author: "특별한 작성자",
            postDetail: { content: "테스트 내용" },
            password: "1234"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const createPostResponse = await request(app.getHttpServer()).post('/graphql').send({ query: createPostMutation }).expect(200);
      const postId = createPostResponse.body.data.createPost.data.id;

      // 게시물 검색
      const searchQuery = `
        query {
          posts(input: { 
            where: { author: "특별한 작성자" },
            pagination: { first: 10 }
          }) {
            edges {
              node {
                id
                title
                author
              }
            }
          }
        }
      `;

      const searchResponse = await request(app.getHttpServer()).post('/graphql').send({ query: searchQuery }).expect(200);

      const searchResults = searchResponse.body.data.posts.edges;
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].node.title).toBe('작성자 검색 테스트용 게시물');
      expect(searchResults[0].node.author).toBe('특별한 작성자');

      // 게시물 삭제 (정리)
      const deletePostMutation = `
        mutation {
          deletePost(input: {
            id: ${postId},
            password: "1234"
          }) {
            success
            message
          }
        }
      `;

      await request(app.getHttpServer()).post('/graphql').send({ query: deletePostMutation }).expect(200);
    });

    it('페이지네이션을 사용하여 게시물을 검색할 수 있어야 한다', async () => {
      // 여러 게시물 생성
      const createPostMutation = `
        mutation($title: String!) {
          createPost(input: {
            title: $title,
            author: "페이지네이션 테스트 작성자",
            postDetail: { content: "테스트 내용" },
            password: "1234"
          }) {
            success
            message
            data {
              id
            }
          }
        }
      `;

      const postIds = [];
      for (let i = 1; i <= 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: createPostMutation,
            variables: { title: `페이지네이션 테스트 게시물 ${i}` },
          })
          .expect(200);
        postIds.push(response.body.data.createPost.data.id);
      }

      // 첫 번째 페이지 검색
      const firstPageQuery = `
        query {
          posts(input: { 
            where: { author: "페이지네이션 테스트 작성자" },
            pagination: { first: 3 }
          }) {
            edges {
              node {
                id
                title
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const firstPageResponse = await request(app.getHttpServer()).post('/graphql').send({ query: firstPageQuery }).expect(200);

      const firstPageResults = firstPageResponse.body.data.posts.edges;
      expect(firstPageResults).toHaveLength(3);
      expect(firstPageResponse.body.data.posts.pageInfo.hasNextPage).toBe(true);

      const endCursor = firstPageResponse.body.data.posts.pageInfo.endCursor;

      // 두 번째 페이지 검색
      const secondPageQuery = `
        query {
          posts(input: { 
            where: { author: "페이지네이션 테스트 작성자" },
            pagination: { first: 3, after: "${endCursor}" }
          }) {
            edges {
              node {
                id
                title
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      const secondPageResponse = await request(app.getHttpServer()).post('/graphql').send({ query: secondPageQuery }).expect(200);

      const secondPageResults = secondPageResponse.body.data.posts.edges;
      expect(secondPageResults).toHaveLength(2);
      expect(secondPageResponse.body.data.posts.pageInfo.hasNextPage).toBe(false);

      // 게시물 삭제 (정리)
      for (const postId of postIds) {
        const deletePostMutation = `
          mutation {
            deletePost(input: {
              id: ${postId},
              password: "1234"
            }) {
              success
              message
            }
          }
        `;
        await request(app.getHttpServer()).post('/graphql').send({ query: deletePostMutation }).expect(200);
      }
    });
  });
});
