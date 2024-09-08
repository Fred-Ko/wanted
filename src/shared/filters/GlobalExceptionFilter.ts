import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { type GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';
import { GraphQLError } from 'graphql';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    // GraphQL 요청인지 확인
    if (host.getType<GqlContextType>() === 'graphql') {
      return this.handleGraphQLException(exception);
    }

    // REST 요청일 경우
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error(exception);

    response.status(status).json({
      statusCode: status,
      message: exception.message || 'Internal server error',
      error: exception.name || 'Error',
    });
  }

  // GraphQL 에러 처리
  private handleGraphQLException(exception: Error) {
    this.logger.error(exception);

    const baseExtensions = {
      code: 'INTERNAL_SERVER_ERROR',
    };

    const devExtensions =
      process.env.NODE_ENV === 'development'
        ? {
            exception,
            stack: exception.stack,
          }
        : {};

    // 일반적인 GraphQL 에러 처리
    return new GraphQLError(exception.message || '서버에서 에러가 발생했습니다', {
      extensions: {
        ...baseExtensions,
        ...devExtensions,
      },
    });
  }
}
