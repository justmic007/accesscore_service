import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessLogsService } from './access-logs.service';

@Controller('access-logs')
@UseGuards(JwtAuthGuard)
export class AccessLogsController {
    constructor(private readonly accessLogsService: AccessLogsService) { }

    @Get()
    async getMyLogs(@CurrentUser() user: any) {
        return this.accessLogsService.findByUser(user.userId);
    }
}
