import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { ApiKey } from '../../modules/api-keys/schemas/api-key.schema';
import { ApiKeyStatus } from '../../modules/api-keys/enums/api-key-status.enum';
import * as hashUtil from '../utils/hash.util';

describe('ApiKeyAuthGuard', () => {
    let guard: ApiKeyAuthGuard;
    let mockApiKeyModel: any;

    beforeEach(async () => {
        mockApiKeyModel = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeyAuthGuard,
                {
                    provide: getModelToken(ApiKey.name),
                    useValue: mockApiKeyModel,
                },
            ],
        }).compile();

        guard = module.get<ApiKeyAuthGuard>(ApiKeyAuthGuard);
    });

    const createMockContext = (headers: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ headers }),
            }),
        } as ExecutionContext;
    };

    it('should throw UnauthorizedException if no API key provided', async () => {
        const context = createMockContext({});
        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if API key is invalid', async () => {
        jest.spyOn(hashUtil, 'hashApiKey').mockResolvedValue('hashed_key');
        mockApiKeyModel.findOne.mockResolvedValue(null);

        const context = createMockContext({ 'x-api-key': 'invalid_key' });
        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if API key is not active', async () => {
        jest.spyOn(hashUtil, 'hashApiKey').mockResolvedValue('hashed_key');
        mockApiKeyModel.findOne.mockResolvedValue({
            status: ApiKeyStatus.REVOKED,
            save: jest.fn(),
        });

        const context = createMockContext({ 'x-api-key': 'valid_key' });
        await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access with valid active API key', async () => {
        const mockApiKey = {
            _id: 'key_id',
            userId: 'user_id',
            status: ApiKeyStatus.ACTIVE,
            expiresAt: new Date(Date.now() + 86400000),
            save: jest.fn(),
        };

        jest.spyOn(hashUtil, 'hashApiKey').mockResolvedValue('hashed_key');
        mockApiKeyModel.findOne.mockResolvedValue(mockApiKey);

        const mockRequest = { headers: { 'x-api-key': 'valid_key' } };
        const context = {
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        } as ExecutionContext;

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(mockRequest['apiKey']).toBe(mockApiKey);
        expect(mockApiKey.save).toHaveBeenCalled();
    });
});
