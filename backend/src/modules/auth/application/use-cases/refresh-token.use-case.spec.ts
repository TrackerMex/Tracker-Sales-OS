import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';
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

function buildRow(
  overrides: Partial<RefreshTokenEntity> = {},
): RefreshTokenEntity {
  return {
    id: 'row-1',
    userId: 'user-1',
    tokenHash: 'stored-hash',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let userRepo: MockedMethods<IUserRepository>;
  let refreshTokenRepo: MockedMethods<IRefreshTokenRepository>;
  let verify: jest.Mock;
  let sign: jest.Mock;
  let decode: jest.Mock;

  beforeEach(async () => {
    verify = jest.fn().mockReturnValue({ sub: 'row-1', userId: 'user-1' });
    sign = jest.fn().mockReturnValue('new.jwt.token');
    decode = jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 604800 });
    userRepo = makeMockUserRepo();
    refreshTokenRepo = makeMockRefreshTokenRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        {
          provide: JwtService,
          useValue: { verify, sign, decode },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, fallback?: unknown) => fallback),
          },
        },
      ],
    }).compile();

    useCase = module.get(RefreshTokenUseCase);
  });

  it('rota exitosamente: revoca la fila vieja, crea una nueva y emite tokens nuevos', async () => {
    const row = buildRow();
    refreshTokenRepo.findById.mockResolvedValue(row);
    userRepo.findById.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    refreshTokenRepo.update.mockResolvedValue(row);
    refreshTokenRepo.create.mockResolvedValue(buildRow({ id: 'row-2' }));

    const result = await useCase.execute({
      refreshToken: 'raw.refresh.token',
    });

    const [revokedId, revokedPatch] = refreshTokenRepo.update.mock.calls[0];
    expect(revokedId).toBe('row-1');
    expect(revokedPatch.revokedAt).toBeInstanceOf(Date);
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', revokedAt: null }),
    );
    expect(refreshTokenRepo.revokeAllActiveForUser).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('new.jwt.token');
    expect(result.refreshToken).toBe('new.jwt.token');
  });

  it('token ya revocado: revoca TODAS las sesiones activas del usuario y lanza 401', async () => {
    const row = buildRow({ revokedAt: new Date() });
    refreshTokenRepo.findById.mockResolvedValue(row);

    await expect(
      useCase.execute({ refreshToken: 'raw.refresh.token' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.revokeAllActiveForUser).toHaveBeenCalledWith(
      'user-1',
    );
    expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    expect(refreshTokenRepo.create).not.toHaveBeenCalled();
  });

  it('token expirado: lanza 401 sin revocar de mas', async () => {
    const row = buildRow({ expiresAt: new Date(Date.now() - 1000) });
    refreshTokenRepo.findById.mockResolvedValue(row);

    await expect(
      useCase.execute({ refreshToken: 'raw.refresh.token' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.revokeAllActiveForUser).not.toHaveBeenCalled();
    expect(refreshTokenRepo.update).not.toHaveBeenCalled();
  });

  it('firma invalida: lanza 401 y no llega a buscar la fila', async () => {
    verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      useCase.execute({ refreshToken: 'tampered.token' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.findById).not.toHaveBeenCalled();
  });

  it('hash no coincide: lanza 401', async () => {
    const row = buildRow();
    refreshTokenRepo.findById.mockResolvedValue(row);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCase.execute({ refreshToken: 'raw.refresh.token' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(refreshTokenRepo.update).not.toHaveBeenCalled();
  });

  it('fila no encontrada: lanza 401', async () => {
    refreshTokenRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'raw.refresh.token' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
