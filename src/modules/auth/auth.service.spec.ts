import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import * as hashUtil from '../../common/utils/hash.util';

describe('AuthService', () => {
    let service: AuthService;
    let mockUserModel: any;
    let mockJwtService: any;

    beforeEach(async () => {
        const mockSave = jest.fn();
        const mockUserConstructor = jest.fn().mockImplementation(() => ({
            save: mockSave,
        }));

        mockUserModel = mockUserConstructor;
        mockUserModel.findOne = jest.fn();
        mockUserModel.findById = jest.fn();

        mockJwtService = {
            sign: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserModel,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            mockUserModel.findOne.mockResolvedValue(null);
            mockUserModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    _id: 'user123',
                    email: registerDto.email,
                    createdAt: new Date(),
                }),
            }));

            jest.spyOn(hashUtil, 'hashPassword').mockResolvedValue('hashedPassword');

            const result = await service.register(registerDto);

            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: registerDto.email });
            expect(result).toHaveProperty('email', registerDto.email);
        });

        it('should throw ConflictException if email already exists', async () => {
            const registerDto = {
                email: 'existing@example.com',
                password: 'Password123!',
            };

            mockUserModel.findOne.mockResolvedValue({ email: registerDto.email });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const mockUser = {
                _id: 'user123',
                email: loginDto.email,
                password: 'hashedPassword',
            };

            mockUserModel.findOne.mockResolvedValue(mockUser);
            jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('jwt-token');

            const result = await service.login(loginDto);

            expect(result).toHaveProperty('accessToken', 'jwt-token');
            expect(result.user).toHaveProperty('email', loginDto.email);
        });

        it('should throw UnauthorizedException with invalid email', async () => {
            const loginDto = {
                email: 'wrong@example.com',
                password: 'Password123!',
            };

            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException with invalid password', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'WrongPassword123!',
            };

            const mockUser = {
                _id: 'user123',
                email: loginDto.email,
                password: 'hashedPassword',
            };

            mockUserModel.findOne.mockResolvedValue(mockUser);
            jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('validateUser', () => {
        it('should return user without password', async () => {
            const userId = 'user123';
            const mockUser = {
                _id: userId,
                email: 'test@example.com',
            };

            mockUserModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.validateUser(userId);

            expect(result).toEqual(mockUser);
            expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
        });
    });
});
