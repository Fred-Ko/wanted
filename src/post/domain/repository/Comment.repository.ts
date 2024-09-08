import { Prisma } from '@prisma/client';
import { CommentEntity } from '@root/generated';

import { PaginatedResult, type CursorPaginationInput } from '@root/shared/types/Pagenation.interface';

export interface CommentRepository {
  findById(id: CommentEntity['id'], tx?: Prisma.TransactionClient): Promise<CommentEntity | null>;
  create(data: Prisma.CommentCreateInput, tx?: Prisma.TransactionClient): Promise<CommentEntity>;
  findManyByPostId(
    postId: CommentEntity['postId'],
    paginationInput?: CursorPaginationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginatedResult<CommentEntity>>;
}
