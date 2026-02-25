import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { GenerateApiKeyDto } from './dto/generate-api-key.dto';
import { ApiKeyStatus } from './enums/api-key-status.enum';

describe('ApiKeysController', () => {
    let controller: ApiKeysController;
    let apiKeysService: ApiKeysService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApiKeysController],
            providers: [
                {
                    provide: ApiKeysService,
                    useValue: {
                        generate: jest.fn(),
                        list: jest.fn(),
                        revoke: jest.fn(),
                        rotate: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<ApiKeysController>(ApiKeysController);
        apiKeysService = module.get<ApiKeysService>(ApiKeysService);
    });

    describe('generate', () => {
        it('should call apiKeysService.generate with userId and dto', async () => {
            const user = { userId: 'user123' };
            const dto: GenerateApiKeyDto = { name: 'Test Key' };

            const mockResult = {
                id: 'key123',
                key: 'ak_live_abc123def456',
                prefix: 'ak_live_abc123',
                name: dto.name,
                status: ApiKeyStatus.ACTIVE,
                expiresAt: new Date(),
                createdAt: new Date(),
            };

            jest.spyOn(apiKeysService, 'generate').mockResolvedValue(mockResult as any);

            const result = await controller.generate(user, dto);

            expect(apiKeysService.generate).toHaveBeenCalledWith(user.userId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('list', () => {
        it('should call apiKeysService.list with userId', async () => {
            const user = { userId: 'user123' };

            const mockResult = [
                {
                    id: 'key123',
                    prefix: 'ak_live_abc123',
                    name: 'Test Key',
                    status: ApiKeyStatus.ACTIVE,
                    createdAt: new Date(),
                },
            ];

            jest.spyOn(apiKeysService, 'list').mockResolvedValue(mockResult as any);

            const result = await controller.list(user);

            expect(apiKeysService.list).toHaveBeenCalledWith(user.userId);
            expect(result).toEqual(mockResult);
        });
    });

    describe('revoke', () => {
        it('should call apiKeysService.revoke with userId and keyId', async () => {
            const user = { userId: 'user123' };
            const keyId = 'key123';

            const mockResult = { message: 'API key revoked successfully' };

            jest.spyOn(apiKeysService, 'revoke').mockResolvedValue(mockResult as any);

            const result = await controller.revoke(user, keyId);

            expect(apiKeysService.revoke).toHaveBeenCalledWith(user.userId, keyId);
            expect(result).toEqual(mockResult);
        });
    });

    describe('rotate', () => {
        it('should call apiKeysService.rotate with userId and keyId', async () => {
            const user = { userId: 'user123' };
            const keyId = 'key123';

            const mockResult = {
                id: 'newKey456',
                key: 'ak_live_xyz789def456',
                prefix: 'ak_live_xyz789',
                name: 'Test Key',
                status: ApiKeyStatus.ACTIVE,
                expiresAt: new Date(),
                createdAt: new Date(),
            };

            jest.spyOn(apiKeysService, 'rotate').mockResolvedValue(mockResult as any);

            const result = await controller.rotate(user, keyId);

            expect(apiKeysService.rotate).toHaveBeenCalledWith(user.userId, keyId);
            expect(result).toEqual(mockResult);
        });
    });
});
