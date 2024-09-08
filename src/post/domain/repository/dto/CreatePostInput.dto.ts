export interface CreatePostInput {
  title: string;
  author: string;
  password: string;
  postDetail: {
    content: string;
  };
}
