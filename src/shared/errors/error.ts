export enum ErrorCode {
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  POST_DETAIL_NOT_FOUND = 'POST_DETAIL_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_INPUT = 'INVALID_INPUT',
  COMMENT_NOT_FOUND = 'COMMENT_NOT_FOUND',
}

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.POST_NOT_FOUND]: 'Post not found',
  [ErrorCode.POST_DETAIL_NOT_FOUND]: 'Post detail not found',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.INVALID_INPUT]: '입력값이 유효하지 않습니다.',
  [ErrorCode.COMMENT_NOT_FOUND]: 'Comment not found',
};

export class CustomError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}
