import type { PostEntity } from '@root/generated';
import type { CreatePostDetailCommand } from '@root/post/domain/command/CreatePostDetail.command';
import * as Joi from 'joi';

export class CreatePostCommand {
  title: PostEntity['title'];
  author: PostEntity['author'];
  password: PostEntity['password'];
  postDetail: CreatePostDetailCommand;
}

export const createPostCommandSchema = Joi.object({
  title: Joi.string().required().max(255).messages({
    'string.base': '제목은 문자열이어야 합니다.',
    'string.empty': '제목은 필수 입력 항목입니다.',
    'string.max': '제목은 최대 255자까지 입력 가능합니다.',
    'any.required': '제목은 필수 입력 항목입니다.',
  }),
  author: Joi.string().required().max(255).messages({
    'string.base': '작성자는 문자열이어야 합니다.',
    'string.empty': '작성자는 필수 입력 항목입니다.',
    'string.max': '작성자는 최대 255자까지 입력 가능합니다.',
    'any.required': '작성자는 필수 입력 항목입니다.',
  }),
  password: Joi.string().required().max(255).messages({
    'string.base': '비밀번호는 문자열이어야 합니다.',
    'string.empty': '비밀번호는 필수 입력 항목입니다.',
    'string.max': '비밀번호는 최대 255자까지 입력 가능합니다.',
    'any.required': '비밀번호는 필수 입력 항목입니다.',
  }),
  postDetail: Joi.object({
    content: Joi.string().required().max(3000).messages({
      'string.base': '내용은 문자열이어야 합니다.',
      'string.empty': '내용은 필수 입력 항목입니다.',
      'string.max': '내용은 최대 3000자까지 입력 가능합니다.',
      'any.required': '내용은 필수 입력 항목입니다.',
    }),
  })
    .required()
    .messages({
      'object.base': '게시글 상세 정보는 객체 형태여야 합니다.',
      'any.required': '게시글 상세 정보는 필수 입력 항목입니다.',
    }),
});
