import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let mockAuthService: any;

    beforeEach(async () => {
        mockAuthService = {
            validateUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('test-secret'),
                    },
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    describe('validate', () => {
        it('should return user when valid', async () => {
            const payload = { sub: 'user123', email: 'test@example.com' };
            const mockUser = { id: 'user123', email: 'test@example.com' };

            mockAuthService.validateUser.mockResolvedValue(mockUser);

            const result = await strategy.validate(payload);

            expect(mockAuthService.validateUser).toHaveBeenCalledWith(payload.sub);
            expect(result).toEqual({ userId: payload.sub, email: payload.email });
        });

        it('should throw UnauthorizedException when user not found', async () => {
            const payload = { sub: 'user123', email: 'test@example.com' };

            mockAuthService.validateUser.mockResolvedValue(null);

            await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
        });
    });
});
