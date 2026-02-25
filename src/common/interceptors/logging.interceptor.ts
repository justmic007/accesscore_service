import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AccessLogsService } from '../../modules/access-logs/access-logs.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly accessLogsService: AccessLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            tap(() => {
                // Only log if request has apiKey metadata (set by ApiKeyAuthGuard)
                if (request.apiKeyId && request.userId) {
                    this.accessLogsService.create({
                        apiKeyId: request.apiKeyId,
                        userId: request.userId,
                        endpoint: request.url,
                        method: request.method,
                        statusCode: response.statusCode,
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                    });
                }
            }),
        );
    }
}
