export class MutationResultPayload<T> {
  success: boolean;
  message?: string;
  data?: T;
}
