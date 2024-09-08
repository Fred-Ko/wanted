export class PostCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly author: string,
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}
