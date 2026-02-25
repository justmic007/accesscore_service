import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name?: string;
}
