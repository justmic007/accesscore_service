import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiKeyStatus } from '../enums/api-key-status.enum';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true, index: true })
  prefix: string;

  @Prop({ maxlength: 50 })
  name?: string;

  @Prop({
    type: String,
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
    index: true,
  })
  status: ApiKeyStatus;

  @Prop({ type: Date, index: true })
  expiresAt?: Date;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Date })
  revokedAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Compound index for efficient queries
ApiKeySchema.index({ userId: 1, status: 1 });
