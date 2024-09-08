import type { PostEntity } from '@root/generated';
import * as Joi from 'joi';

export class DeletePostCommand {
  id: PostEntity['id'];
  password: PostEntity['password'];
}

export const deletePostCommandSchema = Joi.object({
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
});
