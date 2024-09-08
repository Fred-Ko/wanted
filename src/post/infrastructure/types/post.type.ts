import type { Prisma } from '@prisma/client';

export type LimitedPostWhereInput = Pick<Prisma.PostWhereInput, 'title' | 'author'> & {
  AND?: LimitedPostWhereInput | LimitedPostWhereInput[];
  OR?: LimitedPostWhereInput[];
  NOT?: LimitedPostWhereInput | LimitedPostWhereInput[];
};
