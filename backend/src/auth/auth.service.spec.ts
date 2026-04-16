import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed_password',
    role: 'user',
    balance: 100,
    avatarUrl: null,
    refreshTokenHash: 'hashed_refresh_token',
  };

  const mockUsersService = {
    findInternalByIdentifier: jest.fn(),
    findOneInternal: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('fake_token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'at-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'rt-secret';
      return '30m';
    }),
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
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = { identifier: 'testuser', password: 'password123' };

    it('should return tokens on successful login', async () => {
      mockUsersService.findInternalByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_refresh_hash');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(usersService.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findInternalByIdentifier.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      mockUsersService.findInternalByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    const refreshDto = { userId: 'user-uuid', refreshToken: 'valid_rt' };

    it('should return new tokens if refresh token is valid', async () => {
      mockUsersService.findOneInternal.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const result = await service.refreshTokens(refreshDto);

      expect(result).toHaveProperty('accessToken');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should throw Unauthorized if user has no stored token', async () => {
      mockUsersService.findOneInternal.mockResolvedValue({ ...mockUser, refreshTokenHash: null });

      await expect(service.refreshTokens(refreshDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw Unauthorized if token comparison fails', async () => {
      mockUsersService.findOneInternal.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(refreshDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateRefreshToken (private logic)', () => {
    it('should hash and store the refresh token', async () => {
      mockUsersService.findInternalByIdentifier.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_value');

      await service.login({ identifier: 'u', password: 'p' });

      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ refreshTokenHash: 'hashed_value' })
      );
    });
  });
});