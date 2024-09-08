import type { Post, Prisma } from '@prisma/client';
import type { PaginatedResult } from '@root/shared/types/Pagenation.interface';

import { Injectable } from '@nestjs/common';

import { PostEntity } from '@root/generated';
import type { PostRepository } from '@root/post/domain/repository';
import type { CreatePostInput } from '@root/post/domain/repository/dto/CreatePostInput.dto';
import type { FindAllPostsInput } from '@root/post/domain/repository/dto/FindAllPostsInput.dto';
import type { UpdatePostInput } from '@root/post/domain/repository/dto/UpdatePostInput.dto';
import { CustomError, ErrorCode, ErrorMessage } from '@root/shared/errors/error';
import { PrismaService } from '@root/shared/infrastructure/prisma';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PostRepositoryImpl implements PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllPostsInput, tx?: Prisma.TransactionClient): Promise<PaginatedResult<PostEntity>> {
    const client = tx || this.prisma;
    const {
      paginationInput: { first, after },
      searchCriteria,
    } = params;

    if (first <= 0) {
      throw new CustomError(ErrorCode.INVALID_INPUT, ErrorMessage.INVALID_INPUT);
    }

    const posts = await client.post.findMany({
      take: first + 1,
      skip: after ? 1 : 0,
      where: searchCriteria,
      cursor: after ? { id: parseInt(after, 10) } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        postDetail: true,
      },
    });

    const hasNextPage = posts.length > first;
    if (hasNextPage) {
      posts.pop();
    }

    const edges = posts.map((post) => ({
      node: plainToInstance(PostEntity, post),
      cursor: post.id.toString(),
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

  async findById(id: Post['id'], tx?: Prisma.TransactionClient): Promise<PostEntity | null> {
    const client = tx || this.prisma;
    const post = await client.post.findUnique({ where: { id }, include: { postDetail: true } });
    return plainToInstance(PostEntity, post);
  }

  async findByIds(ids: Post['id'][], tx?: Prisma.TransactionClient): Promise<PostEntity[]> {
    const client = tx || this.prisma;
    const posts = await client.post.findMany({ where: { id: { in: ids } }, include: { postDetail: true } });
    return posts.map((post) => plainToInstance(PostEntity, post));
  }

  async create(data: CreatePostInput, tx?: Prisma.TransactionClient): Promise<PostEntity> {
    const client = tx || this.prisma;
    const post = await client.post.create({
      data: {
        ...data,
        postDetail: {
          create: data.postDetail,
        },
      },
      include: {
        postDetail: true,
      },
    });
    return plainToInstance(PostEntity, post);
  }

  async update(id: Post['id'], data: UpdatePostInput, tx?: Prisma.TransactionClient): Promise<PostEntity> {
    const client = tx || this.prisma;
    const post = await client.post.update({ where: { id }, data, include: { postDetail: true } });
    return plainToInstance(PostEntity, post);
  }

  async deleteById(id: Post['id'], tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || this.prisma;
    if (tx) {
      await client.postDetail.deleteMany({ where: { postId: id } });
      await client.post.delete({ where: { id } });
    } else {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.postDetail.deleteMany({ where: { postId: id } });
        await transaction.post.delete({ where: { id } });
      });
    }
  }
}
