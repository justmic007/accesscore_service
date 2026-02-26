import { IsOptional, IsString, MaxLength, IsNumber, Min, Max } from 'class-validator';

export class GenerateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Rate limit must be at least 1' })
  @Max(10000, { message: 'Rate limit must not exceed 10000' })
  rateLimit?: number;
}
