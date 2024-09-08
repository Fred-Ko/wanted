import type { PostEntity } from '@root/generated';
import type { UpdatePostDetailCommand } from '@root/post/domain/command/UpdatePostDetail.command';
import * as Joi from 'joi';

export class UpdatePostCommand {
  id: PostEntity['id'];
  password: PostEntity['password'];
  author?: PostEntity['author'];
  title?: PostEntity['title'];
  updatePostDetailCommand?: UpdatePostDetailCommand;
}

export const updatePostCommandSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': '게시글 ID는 숫자여야 합니다.',
    'number.integer': '게시글 ID는 정수여야 합니다.',
    'number.positive': '게시글 ID는 양수여야 합니다.',
    'any.required': '게시글 ID는 필수 입력 항목입니다.',
  }),
  password: Joi.string().required().max(255).messages({
    'string.base': '비밀번호는 문자열이어야 합니다.',
    'string.empty': '비밀번호는 필수 입력 항목입니다.',
    'string.max': '비밀번호는 최대 255자까지 입력 가능합니다.',
    'any.required': '비밀번호는 필수 입력 항목입니다.',
  }),
  author: Joi.string().max(255).messages({
    'string.base': '작성자는 문자열이어야 합니다.',
    'string.max': '작성자는 최대 255자까지 입력 가능합니다.',
  }),
  title: Joi.string().max(255).messages({
    'string.base': '제목은 문자열이어야 합니다.',
    'string.max': '제목은 최대 255자까지 입력 가능합니다.',
  }),
  updatePostDetailCommand: Joi.object({
    content: Joi.string().max(3000).messages({
      'string.base': '내용은 문자열이어야 합니다.',
      'string.max': '내용은 최대 3000자까지 입력 가능합니다.',
    }),
  }).messages({
    'object.base': '게시글 상세 정보 업데이트는 객체 형태여야 합니다.',
  }),
});
