export class PostUpdatedEvent {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly author: string,
    public readonly updatedAt: Date,
    public readonly content?: string,
  ) {}
}
