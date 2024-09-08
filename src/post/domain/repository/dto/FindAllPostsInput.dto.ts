import { LimitedPostWhereInput } from '@root/post/infrastructure/types/post.type';
import { CursorPaginationInput } from '@root/shared/types/Pagenation.interface';

export interface FindAllPostsInput {
  paginationInput: CursorPaginationInput;
  searchCriteria: LimitedPostWhereInput;
}
