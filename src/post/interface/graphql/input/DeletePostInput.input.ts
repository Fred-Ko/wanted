import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';

@InputType()
export class DeletePostInput {
  @Field(() => ID)
  @Transform(({ value }) => parseInt(value, 10))
  id: number;

  @Field()
  password: string;
}
