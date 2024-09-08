import type { CommentEntity, PostEntity } from '@root/generated';
import * as Joi from 'joi';

export class CreateCommentCommand {
  postId: PostEntity['id'];
  content: CommentEntity['content'];
  author: CommentEntity['author'];
  parentId?: CommentEntity['parentId'];
}

export const createCommentCommandSchema = Joi.object({
  postId: Joi.number().integer().positive().required().messages({
    'number.base': '게시글 ID는 숫자여야 합니다.',
    'number.integer': '게시글 ID는 정수여야 합니다.',
    'number.positive': '게시글 ID는 양수여야 합니다.',
    'any.required': '게시글 ID는 필수 입력 항목입니다.',
  }),
  content: Joi.string().required().max(3000).messages({
    'string.base': '댓글 내용은 문자열이어야 합니다.',
    'string.empty': '댓글 내용은 필수 입력 항목입니다.',
    'string.max': '댓글 내용은 최대 3000자까지 입력 가능합니다.',
    'any.required': '댓글 내용은 필수 입력 항목입니다.',
  }),
  author: Joi.string().required().max(255).messages({
    'string.base': '작성자는 문자열이어야 합니다.',
    'string.empty': '작성자는 필수 입력 항목입니다.',
    'string.max': '작성자는 최대 255자까지 입력 가능합니다.',
    'any.required': '작성자는 필수 입력 항목입니다.',
  }),
  parentId: Joi.number().integer().positive().messages({
    'number.base': '부모 댓글 ID는 숫자여야 합니다.',
    'number.integer': '부모 댓글 ID는 정수여야 합니다.',
    'number.positive': '부모 댓글 ID는 양수여야 합니다.',
  }),
});
