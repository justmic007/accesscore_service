import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ApiKeyRateLimitGuard } from './api-key-rate-limit.guard';
import { AccessLog } from '../../modules/access-logs/schemas/access-log.schema';

describe('ApiKeyRateLimitGuard', () => {
    let guard: ApiKeyRateLimitGuard;
    let mockAccessLogModel: any;

    beforeEach(async () => {
        mockAccessLogModel = {
            countDocuments: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeyRateLimitGuard,
                {
                    provide: getModelToken(AccessLog.name),
                    useValue: mockAccessLogModel,
                },
            ],
        }).compile();

        guard = module.get<ApiKeyRateLimitGuard>(ApiKeyRateLimitGuard);
    });

    const createMockContext = (request: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as ExecutionContext;
    };

    it('should allow request if no API key is present', async () => {
        const context = createMockContext({});
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should allow request if under rate limit', async () => {
        mockAccessLogModel.countDocuments.mockResolvedValue(50);

        const context = createMockContext({
            apiKeyId: 'key_id',
            apiKey: { rateLimit: 100 },
        });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should throw exception if rate limit exceeded', async () => {
        mockAccessLogModel.countDocuments.mockResolvedValue(100);

        const context = createMockContext({
            apiKeyId: 'key_id',
            apiKey: { rateLimit: 100 },
        });

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
        await expect(guard.canActivate(context)).rejects.toThrow(
            expect.objectContaining({
                response: 'Rate limit exceeded. Maximum 100 requests per hour.',
                status: HttpStatus.TOO_MANY_REQUESTS,
            }),
        );
    });

    it('should use default rate limit if not specified', async () => {
        mockAccessLogModel.countDocuments.mockResolvedValue(100);

        const context = createMockContext({
            apiKeyId: 'key_id',
            apiKey: {},
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
            'Rate limit exceeded. Maximum 100 requests per hour.',
        );
    });
});
