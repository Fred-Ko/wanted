import { faker } from '@faker-js/faker/locale/ko';
import { CommentEntity, PostDetailVO, PostEntity } from '@root/generated';
import { CreateCommentCommand, CreatePostCommand, DeletePostCommand, UpdatePostCommand } from '@root/post/domain/command';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

function mergeWithOverride<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;
  const result = { ...base };
  Object.keys(override).forEach((key) => {
    const overrideValue = override[key as keyof DeepPartial<T>];
    if (overrideValue === undefined || overrideValue === null) {
      delete result[key as keyof T];
    } else if (typeof base[key as keyof T] === 'object' && typeof overrideValue === 'object') {
      result[key as keyof T] = mergeWithOverride(base[key as keyof T] as any, overrideValue as any) as T[keyof T];
    } else {
      result[key as keyof T] = overrideValue as T[keyof T];
    }
  });
  return result;
}

export const createFakePostEntity = (override?: DeepPartial<PostEntity>): PostEntity => {
  const defaultPostDetail: PostDetailVO = createFakePostDetailVO();
  const baseEntity: PostEntity = {
    id: faker.number.int(),
    title: faker.lorem.sentence(),
    author: faker.person.fullName(),
    password: faker.internet.password(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    postDetail: defaultPostDetail,
  };

  return mergeWithOverride(baseEntity, override);
};

export const createFakePostDetailVO = (override?: DeepPartial<PostDetailVO>): PostDetailVO => {
  const basePostDetail: PostDetailVO = {
    content: faker.lorem.paragraphs(),
    postId: faker.number.int(),
  };

  return mergeWithOverride(basePostDetail, override);
};

export const createFakeCommentEntity = (override?: DeepPartial<CommentEntity>): CommentEntity => {
  const baseComment: CommentEntity = {
    id: faker.number.int(),
    content: faker.lorem.paragraph(),
    author: faker.person.fullName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    postId: faker.number.int(),
    parentId: faker.number.int(),
  };

  return mergeWithOverride(baseComment, override);
};

export const createFakeCreatePostCommand = (override?: DeepPartial<CreatePostCommand>): CreatePostCommand => {
  const baseCommand: CreatePostCommand = {
    title: faker.lorem.sentence(),
    author: faker.person.fullName(),
    password: faker.internet.password(),
    postDetail: {
      content: faker.lorem.paragraphs(),
    },
  };

  return mergeWithOverride(baseCommand, override);
};

export const createFakeCreateCommentCommand = (override?: DeepPartial<CreateCommentCommand>): CreateCommentCommand => {
  const baseCommand: CreateCommentCommand = {
    postId: faker.number.int(),
    content: faker.lorem.paragraph(),
    author: faker.person.fullName(),
    parentId: faker.number.int(),
  };

  return mergeWithOverride(baseCommand, override);
};

export const createFakeUpdatePostCommand = (override?: DeepPartial<UpdatePostCommand>): UpdatePostCommand => {
  const baseCommand: UpdatePostCommand = {
    id: faker.number.int(),
    password: faker.internet.password(),
    author: faker.person.fullName(),
    title: faker.lorem.sentence(),
    updatePostDetailCommand: {
      content: faker.lorem.paragraphs(),
    },
  };

  return mergeWithOverride(baseCommand, override);
};

export const createFakeDeletePostCommand = (override?: DeepPartial<DeletePostCommand>): DeletePostCommand => {
  const baseCommand: DeletePostCommand = {
    id: faker.number.int(),
    password: faker.internet.password(),
  };

  return mergeWithOverride(baseCommand, override);
};
