import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserEntity, UserRole } from '../../domain/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

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

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
    userRepo = module.get(USER_REPOSITORY);
    jwtService = module.get(JwtService);
  });

  describe('execute', () => {
    it('retorna accessToken y user cuando credenciales son validas', async () => {
      userRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await useCase.execute({ username: 'john', password: 'secret123' });

      expect(result.accessToken).toBe('mock.jwt.token');
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

    it('el JWT payload contiene sub, username, role, sellerId', async () => {
      userRepo.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await useCase.execute({ username: 'john', password: 'secret123' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
        sellerId: mockUser.sellerId,
      });
    });
  });
});
