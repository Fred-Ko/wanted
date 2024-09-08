import type { PostDetailVO } from '@root/generated';
import * as Joi from 'joi';

export class CreatePostDetailCommand {
  content: PostDetailVO['content'];
}

export const createPostDetailCommandSchema = Joi.object({
  content: Joi.string().required().max(3000).messages({
    'string.base': '내용은 문자열이어야 합니다.',
    'string.empty': '내용은 필수 입력 항목입니다.',
    'string.max': '내용은 최대 3000자까지 입력 가능합니다.',
    'any.required': '내용은 필수 입력 항목입니다.',
  }),
});
