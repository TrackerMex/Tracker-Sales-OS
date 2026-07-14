import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { UserEntity, UserRole } from '../../domain/entities/user.entity';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

type MockedMethods<T> = {
  [Key in keyof T]: T[Key] extends (...args: never[]) => unknown
    ? jest.MockedFunction<T[Key]>
    : never;
};

const makeMockUserRepo = (): MockedMethods<IUserRepository> => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findByUsername: jest.fn(),
});

const makeMockRefreshTokenRepo =
  (): MockedMethods<IRefreshTokenRepository> => ({
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    revokeAllActiveForUser: jest.fn(),
  });

const mockUser: UserEntity = {
  id: 'user-1',
  username: 'john',
  passwordHash: 'hashed-password',
  name: 'John Doe',
  role: UserRole.Seller,
  sellerId: 'seller-1',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockRefreshTokenRow: RefreshTokenEntity = {
  id: 'refresh-row-1',
  userId: 'user-1',
  tokenHash: '',
  expiresAt: new Date(),
  revokedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: MockedMethods<IUserRepository>;
  let refreshTokenRepo: MockedMethods<IRefreshTokenRepository>;
  let sign: jest.Mock;
  let decode: jest.Mock;

  beforeEach(async () => {
    sign = jest.fn().mockReturnValue('mock.jwt.token');
    decode = jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 604800 });
    userRepo = makeMockUserRepo();
    refreshTokenRepo = makeMockRefreshTokenRepo();
    refreshTokenRepo.create.mockResolvedValue(mockRefreshTokenRow);
    refreshTokenRepo.update.mockResolvedValue(mockRefreshTokenRow);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        {
          provide: JwtService,
          useValue: {
            sign,
            decode,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, fallback?: unknown) => fallback),
          },
        },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  describe('execute', () => {
    it('retorna accessToken, refreshToken y user cuando credenciales son validas', async () => {
      userRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const result = await useCase.execute({
        username: 'john',
        password: 'secret123',
      });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(result.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        name: mockUser.name,
        role: mockUser.role,
        sellerId: mockUser.sellerId,
      });
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      userRepo.findByUsername.mockResolvedValue(null);

      await expect(
        useCase.execute({ username: 'nobody', password: 'secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario esta inactivo', async () => {
      userRepo.findByUsername.mockResolvedValue({ ...mockUser, active: false });

      await expect(
        useCase.execute({ username: 'john', password: 'secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contrasena es incorrecta', async () => {
      userRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        useCase.execute({ username: 'john', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('el JWT payload del access token contiene sub, username, role, sellerId', async () => {
      userRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      await useCase.execute({ username: 'john', password: 'secret123' });

      expect(sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
        sellerId: mockUser.sellerId,
      });
    });

    it('crea una fila en refresh_tokens y persiste el hash del refresh token', async () => {
      userRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      await useCase.execute({ username: 'john', password: 'secret123' });

      expect(refreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser.id, revokedAt: null }),
      );
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        mockRefreshTokenRow.id,
        expect.objectContaining({ tokenHash: 'hashed-refresh-token' }),
      );
      expect(sign).toHaveBeenCalledWith(
        { sub: mockRefreshTokenRow.id, userId: mockUser.id },
        { secret: 'changeme-refresh', expiresIn: '7d' },
      );
    });
  });
});
