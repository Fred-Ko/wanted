import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

@InputType()
export class UpdatePostInput {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id: number;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  content?: string;

  @Field()
  password: string;
}
