import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessLogsService } from './access-logs.service';
import { AccessLog, AccessLogSchema } from './schemas/access-log.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AccessLog.name, schema: AccessLogSchema },
        ]),
    ],
    providers: [AccessLogsService],
    exports: [AccessLogsService],
})
export class AccessLogsModule { }