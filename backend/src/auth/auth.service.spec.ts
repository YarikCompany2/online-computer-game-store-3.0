import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service"
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from "@nestjs/common";

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;

    const mockUsersService = {
        findByEmail: jest.fn(),
        findOneInternal: jest.fn(),
        update: jest.fn(),
    };

    const mockJwtService = {
        signAsync: jest.fn().mockResolvedValue('fake_token'),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('secret'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return tokens if password is correct', async () => {
            const password = 'password123';
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = { id: 'uuid', email: 'test@test.com', passwordHash: hashedPassword, role: 'user', companyId: null };

            mockUsersService.findByEmail.mockResolvedValue(user);

            const result = await service.login({ email: 'test@test.com', password });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
        });

        it('should thow UnauthorizedException if password is wrong', async () => {
            const user = {id: 'uuid', email: 'test@test.com', passwordHash: 'hashed_pass', role: 'user' };

            mockUsersService.findByEmail.mockResolvedValue(user);

            await expect(
                service.login({ email: 'test@test.com', password: 'wrong_password' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens if refresh token is valid', async () => {
            const user = {
                id: 'uuid',
                email: 'test@test.com',
                refreshTokenHash: await bcrypt.hash('valid_refresh', 10),
                role: 'user',
                companyId: null
            };

            mockUsersService.findOneInternal.mockResolvedValue(user);
            mockUsersService.update.mockResolvedValue({ affected: 1 });

            const result = await service.refreshTokens({
                userId: 'uuid',
                refreshToken: 'valid_refresh'
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(mockUsersService.findOneInternal).toHaveBeenCalledWith('uuid');
            expect(mockUsersService.update).toHaveBeenCalled();
        });

        it('should throw Unauthorized if refresh token is invalid', async () => {
            const user = { id: 'uuid', refreshTokenHash: 'some_hash' };
            mockUsersService.findOneInternal = jest.fn().mockResolvedValue(user);

            await expect(
                service.refreshTokens({ userId: 'uuid', refreshToken: 'wrong_token' })
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});