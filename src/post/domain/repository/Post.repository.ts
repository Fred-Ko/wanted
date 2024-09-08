import { Prisma } from '@prisma/client';
import { PostEntity } from '@root/generated';
import { PaginatedResult } from '@root/shared/types/Pagenation.interface';
import { CreatePostInput } from './dto/CreatePostInput.dto';
import { FindAllPostsInput } from './dto/FindAllPostsInput.dto';
import { UpdatePostInput } from './dto/UpdatePostInput.dto';

export interface PostRepository {
  findAll(params: FindAllPostsInput, tx?: Prisma.TransactionClient): Promise<PaginatedResult<PostEntity>>;
  findById(id: PostEntity['id'], tx?: Prisma.TransactionClient): Promise<PostEntity | null>;
  findByIds(ids: PostEntity['id'][], tx?: Prisma.TransactionClient): Promise<PostEntity[]>;
  create(data: CreatePostInput, tx?: Prisma.TransactionClient): Promise<PostEntity>;
  update(id: PostEntity['id'], data: UpdatePostInput, tx?: Prisma.TransactionClient): Promise<PostEntity>;
  deleteById(id: PostEntity['id'], tx?: Prisma.TransactionClient): Promise<void>;
}
