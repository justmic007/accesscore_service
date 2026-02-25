import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { GenerateApiKeyDto } from './dto/generate-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async generate(
    @CurrentUser() user: any,
    @Body() generateApiKeyDto: GenerateApiKeyDto,
  ) {
    return this.apiKeysService.generate(user.userId, generateApiKeyDto);
  }

  @Get()
  async list(@CurrentUser() user: any) {
    return this.apiKeysService.list(user.userId);
  }

  @Delete(':id')
  async revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.revoke(user.userId, id);
  }

  @Post(':id/rotate')
  async rotate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.rotate(user.userId, id);
  }
}
