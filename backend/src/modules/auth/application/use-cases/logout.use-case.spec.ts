import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LogoutUseCase } from './logout.use-case';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';

type MockedMethods<T> = {
  [Key in keyof T]: T[Key] extends (...args: never[]) => unknown
    ? jest.MockedFunction<T[Key]>
    : never;
};

const makeMockRefreshTokenRepo =
  (): MockedMethods<IRefreshTokenRepository> => ({
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    revokeAllActiveForUser: jest.fn(),
  });

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

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let refreshTokenRepo: MockedMethods<IRefreshTokenRepository>;
  let verify: jest.Mock;

  beforeEach(async () => {
    verify = jest.fn().mockReturnValue({ sub: 'row-1', userId: 'user-1' });
    refreshTokenRepo = makeMockRefreshTokenRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        {
          provide: JwtService,
          useValue: { verify },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, fallback?: unknown) => fallback),
          },
        },
      ],
    }).compile();

    useCase = module.get(LogoutUseCase);
  });

  it('revoca la fila correspondiente al refresh token recibido', async () => {
    refreshTokenRepo.findById.mockResolvedValue(buildRow());

    await useCase.execute({ refreshToken: 'raw.refresh.token' });

    expect(refreshTokenRepo.findById).toHaveBeenCalledWith('row-1');
    const [id, patch] = refreshTokenRepo.update.mock.calls[0];
    expect(id).toBe('row-1');
    expect(patch.revokedAt).toBeInstanceOf(Date);
  });

  it('no toca otras filas del mismo usuario', async () => {
    refreshTokenRepo.findById.mockResolvedValue(buildRow());

    await useCase.execute({ refreshToken: 'raw.refresh.token' });

    expect(refreshTokenRepo.update).toHaveBeenCalledTimes(1);
    expect(refreshTokenRepo.update).toHaveBeenCalledWith(
      'row-1',
      expect.anything(),
    );
  });

  it('no revoca de nuevo una fila ya revocada', async () => {
    refreshTokenRepo.findById.mockResolvedValue(
      buildRow({ revokedAt: new Date() }),
    );

    await useCase.execute({ refreshToken: 'raw.refresh.token' });

    expect(refreshTokenRepo.update).not.toHaveBeenCalled();
  });

  it('best-effort: no lanza si la firma es invalida (permite logout local igual)', async () => {
    verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(
      useCase.execute({ refreshToken: 'tampered.token' }),
    ).resolves.toBeUndefined();
    expect(refreshTokenRepo.update).not.toHaveBeenCalled();
  });

  it('best-effort: no lanza si la fila no existe', async () => {
    refreshTokenRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'raw.refresh.token' }),
    ).resolves.toBeUndefined();
    expect(refreshTokenRepo.update).not.toHaveBeenCalled();
  });
});
