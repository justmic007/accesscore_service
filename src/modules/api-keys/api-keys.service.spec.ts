import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './schemas/api-key.schema';
import { ApiKeyStatus } from './enums/api-key-status.enum';
import * as cryptoUtil from '../../common/utils/crypto.util';
import * as hashUtil from '../../common/utils/hash.util';

describe('ApiKeysService', () => {
    let service: ApiKeysService;
    let mockApiKeyModel: any;
    let mockConfigService: any;

    beforeEach(async () => {
        const mockSave = jest.fn();
        const mockApiKeyConstructor = jest.fn().mockImplementation(() => ({
            save: mockSave,
        }));

        mockApiKeyModel = mockApiKeyConstructor;
        mockApiKeyModel.countDocuments = jest.fn();
        mockApiKeyModel.find = jest.fn();
        mockApiKeyModel.findById = jest.fn();

        mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'app.apiKeyMaxActive') return 3;
                if (key === 'app.apiKeyDefaultExpirationDays') return 365;
                return null;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeysService,
                {
                    provide: getModelToken(ApiKey.name),
                    useValue: mockApiKeyModel,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<ApiKeysService>(ApiKeysService);
    });

    describe('generate', () => {
        it('should generate API key successfully', async () => {
            const userId = 'user123';
            const dto = { name: 'Test Key' };

            mockApiKeyModel.countDocuments.mockResolvedValue(2);
            mockApiKeyModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    _id: 'key123',
                    prefix: 'ak_live_abc123',
                    name: dto.name,
                    status: ApiKeyStatus.ACTIVE,
                    expiresAt: new Date(),
                    createdAt: new Date(),
                }),
            }));

            jest.spyOn(cryptoUtil, 'generateApiKey').mockReturnValue({
                key: 'ak_live_abc123def456',
                prefix: 'ak_live_abc123',
            });
            jest.spyOn(hashUtil, 'hashApiKey').mockResolvedValue('hashedKey');

            const result = await service.generate(userId, dto);

            expect(result).toHaveProperty('key', 'ak_live_abc123def456');
            expect(result).toHaveProperty('prefix', 'ak_live_abc123');
        });

        it('should throw ForbiddenException when max keys exceeded', async () => {
            const userId = 'user123';
            const dto = { name: 'Test Key' };

            mockApiKeyModel.countDocuments.mockResolvedValue(3);

            await expect(service.generate(userId, dto)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('list', () => {
        it('should return list of API keys', async () => {
            const userId = 'user123';

            const mockKeys = [
                {
                    _id: 'key1',
                    prefix: 'ak_live_abc123',
                    name: 'Key 1',
                    status: ApiKeyStatus.ACTIVE,
                    createdAt: new Date(),
                },
            ];

            mockApiKeyModel.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockKeys),
            });

            const result = await service.list(userId);

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('prefix', 'ak_live_abc123');
        });
    });

    describe('revoke', () => {
        it('should revoke API key successfully', async () => {
            const userId = 'user123';
            const keyId = 'key123';

            const mockKey = {
                _id: keyId,
                userId: userId,
                status: ApiKeyStatus.ACTIVE,
                save: jest.fn().mockResolvedValue(true),
            };

            mockApiKeyModel.findById.mockResolvedValue(mockKey);

            const result = await service.revoke(userId, keyId);

            expect(result).toHaveProperty('message', 'API key revoked successfully');
            expect(mockKey.status).toBe(ApiKeyStatus.REVOKED);
        });

        it('should throw NotFoundException if key not found', async () => {
            const userId = 'user123';
            const keyId = 'nonexistent';

            mockApiKeyModel.findById.mockResolvedValue(null);

            await expect(service.revoke(userId, keyId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if key belongs to different user', async () => {
            const userId = 'user123';
            const keyId = 'key123';

            const mockKey = {
                _id: keyId,
                userId: 'differentUser',
                status: ApiKeyStatus.ACTIVE,
            };

            mockApiKeyModel.findById.mockResolvedValue(mockKey);

            await expect(service.revoke(userId, keyId)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('rotate', () => {
        it('should rotate API key successfully', async () => {
            const userId = 'user123';
            const keyId = 'key123';

            const mockOldKey = {
                _id: keyId,
                userId: userId,
                name: 'Old Key',
                status: ApiKeyStatus.ACTIVE,
                save: jest.fn().mockResolvedValue(true),
            };

            mockApiKeyModel.findById.mockResolvedValue(mockOldKey);
            mockApiKeyModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    _id: 'newKey123',
                    prefix: 'ak_live_xyz789',
                    name: 'Old Key',
                    status: ApiKeyStatus.ACTIVE,
                    expiresAt: new Date(),
                    createdAt: new Date(),
                }),
            }));

            jest.spyOn(cryptoUtil, 'generateApiKey').mockReturnValue({
                key: 'ak_live_xyz789def456',
                prefix: 'ak_live_xyz789',
            });
            jest.spyOn(hashUtil, 'hashApiKey').mockResolvedValue('hashedNewKey');

            const result = await service.rotate(userId, keyId);

            expect(result).toHaveProperty('key', 'ak_live_xyz789def456');
            expect(mockOldKey.status).toBe(ApiKeyStatus.REVOKED);
        });

        it('should throw NotFoundException if key not found', async () => {
            const userId = 'user123';
            const keyId = 'nonexistent';

            mockApiKeyModel.findById.mockResolvedValue(null);

            await expect(service.rotate(userId, keyId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if key belongs to different user', async () => {
            const userId = 'user123';
            const keyId = 'key123';

            const mockOldKey = {
                _id: keyId,
                userId: 'differentUser',
                status: ApiKeyStatus.ACTIVE,
            };

            mockApiKeyModel.findById.mockResolvedValue(mockOldKey);

            await expect(service.rotate(userId, keyId)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if key is already revoked', async () => {
            const userId = 'user123';
            const keyId = 'key123';

            const mockOldKey = {
                _id: keyId,
                userId: userId,
                status: ApiKeyStatus.REVOKED,
            };

            mockApiKeyModel.findById.mockResolvedValue(mockOldKey);

            await expect(service.rotate(userId, keyId)).rejects.toThrow(ForbiddenException);
        });
    });
});
