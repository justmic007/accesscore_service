import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        register: jest.fn(),
                        login: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    describe('register', () => {
        it('should call authService.register with registerDto', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const mockResult = {
                id: 'user123',
                email: registerDto.email,
                createdAt: new Date(),
            };

            jest.spyOn(authService, 'register').mockResolvedValue(mockResult as any);

            const result = await controller.register(registerDto);

            expect(authService.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('login', () => {
        it('should call authService.login with loginDto', async () => {
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const mockResult = {
                accessToken: 'jwt-token',
                user: {
                    id: 'user123',
                    email: loginDto.email,
                },
            };

            jest.spyOn(authService, 'login').mockResolvedValue(mockResult as any);

            const result = await controller.login(loginDto);

            expect(authService.login).toHaveBeenCalledWith(loginDto);
            expect(result).toEqual(mockResult);
        });
    });
});
