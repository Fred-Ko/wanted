import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CommentEntity } from '@root/generated';

import type { CommentRepository } from '@root/post/domain/repository/Comment.repository';
import { CustomError, ErrorCode, ErrorMessage } from '@root/shared/errors/error';

import { PrismaService } from '@root/shared/infrastructure/prisma';
import type { CursorPaginationInput, PaginatedResult } from '@root/shared/types/Pagenation.interface';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CommentRepositoryImpl implements CommentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: CommentEntity['id'], tx?: Prisma.TransactionClient): Promise<CommentEntity | null> {
    const client = tx || this.prisma;
    const comment = await client.comment.findUnique({ where: { id } });
    return plainToInstance(CommentEntity, comment);
  }

  async create(data: Prisma.CommentCreateInput, tx?: Prisma.TransactionClient): Promise<CommentEntity> {
    const client = tx || this.prisma;
    const comment = await client.comment.create({
      data,
    });
    return plainToInstance(CommentEntity, comment);
  }

  async findManyByPostId(
    postId: CommentEntity['postId'],
    paginationInput: CursorPaginationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginatedResult<CommentEntity>> {
    const { first, after } = paginationInput;

    if (first <= 0) {
      throw new CustomError(ErrorCode.INVALID_INPUT, ErrorMessage.INVALID_INPUT);
    }

    const client = tx || this.prisma;
    const comments = await client.comment.findMany({
      take: first,
      skip: after ? 1 : 0,
      cursor: after ? { id: parseInt(after, 10) } : undefined,
      where: {
        postId,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const hasNextPage = comments.length === first;

    const edges = comments.map((comment) => ({
      node: plainToInstance(CommentEntity, comment),
      cursor: comment.id.toString(),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
      },
    };
  }
}
