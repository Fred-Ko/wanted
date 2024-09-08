/////////////////////////////////////////////////////////////////////////////////////////////////
// DO NOT MODIFY THIS FILE                                                                     //
// This file is automatically generated by ZenStack Plugin and should not be manually updated. //
/////////////////////////////////////////////////////////////////////////////////////////////////

import { Type } from 'class-transformer';
import { PostEntity } from './index';

export class CommentEntity {
  public readonly id: number;
  public readonly postId: number;
  public readonly content: string;
  public readonly author: string;
  public readonly createdAt: Date;
  public readonly parentId?: number;
  @Type(() => PostEntity)
  public readonly post?: PostEntity;
  @Type(() => CommentEntity)
  public readonly replies?: CommentEntity[];
  @Type(() => CommentEntity)
  public readonly parentComment?: CommentEntity;
  public readonly updatedAt?: Date;
}

