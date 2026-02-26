import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AccessLogsService } from './access-logs.service';
import { AccessLog } from './schemas/access-log.schema';

describe('AccessLogsService', () => {
    let service: AccessLogsService;
    let mockAccessLogModel: any;

    beforeEach(async () => {
        const mockSave = jest.fn();
        const mockAccessLogConstructor = jest.fn().mockImplementation(() => ({
            save: mockSave,
        }));

        mockAccessLogModel = mockAccessLogConstructor;
        mockAccessLogModel.find = jest.fn();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccessLogsService,
                {
                    provide: getModelToken(AccessLog.name),
                    useValue: mockAccessLogModel,
                },
            ],
        }).compile();

        service = module.get<AccessLogsService>(AccessLogsService);
    });

    describe('create', () => {
        it('should create an access log', async () => {
            const logData = {
                apiKeyId: '507f1f77bcf86cd799439011',
                userId: '507f191e810c19729de860ea',
                endpoint: '/api-keys',
                method: 'GET',
                statusCode: 200,
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
            };

            mockAccessLogModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    _id: 'log123',
                    ...logData,
                }),
            }));

            const result = await service.create(logData);

            expect(result).toHaveProperty('_id', 'log123');
        });
    });

    describe('findByUser', () => {
        it('should return logs for a user', async () => {
            const userId = 'user123';
            const mockLogs = [{ _id: 'log1', userId, endpoint: '/test' }];

            mockAccessLogModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockLogs),
                    }),
                }),
            });

            const result = await service.findByUser(userId);

            expect(result).toEqual(mockLogs);
            expect(mockAccessLogModel.find).toHaveBeenCalledWith({ userId });
        });
    });

    describe('findByApiKey', () => {
        it('should return logs for an API key', async () => {
            const apiKeyId = 'key123';
            const mockLogs = [{ _id: 'log1', apiKeyId, endpoint: '/test' }];

            mockAccessLogModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockLogs),
                    }),
                }),
            });

            const result = await service.findByApiKey(apiKeyId);

            expect(result).toEqual(mockLogs);
            expect(mockAccessLogModel.find).toHaveBeenCalledWith({ apiKeyId });
        });
    });
});
