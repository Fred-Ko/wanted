export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface PaginatedResult<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

export interface CursorPaginationInput {
  first: number;
  after?: string;
}
