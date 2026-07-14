import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import {
  ClientEntity,
  ClientSource,
  ClientType,
  PersonType,
  PipelineStage,
} from '../../domain/entities/client.entity';
import { IClientRepository } from '../../domain/repositories/client.repository.interface';
import { CreateClientDto, RequestUserDto } from '../dtos/client.dto';
import { CreateClientUseCase } from './create-client.use-case';

type MockClientRepository = jest.Mocked<IClientRepository>;

const baseDto: CreateClientDto = {
  name: 'Acme México',
  domain: 'acme.mx',
  type: ClientType.Prospecto,
  person: PersonType.Moral,
  source: ClientSource.ProspeccionPropia,
};

const makeUser = (
  role: UserRole,
  sellerId: string | null = null,
): RequestUserDto => ({ id: 'user-1', role, sellerId });

const makeClient = (overrides: Partial<ClientEntity> = {}): ClientEntity =>
  Object.assign(new ClientEntity(), {
    id: 'client-1',
    ...baseDto,
    sellerId: 'seller-1',
    stage: PipelineStage.Prospecto,
    expectedAmount: 0,
    units: 0,
    pain: null,
    provider: null,
    nextStep: null,
    nextDate: null,
    nextTime: null,
    contacts: [],
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
    updatedAt: new Date('2026-07-13T10:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  });

const makeRepo = (): MockClientRepository => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findBySellerId: jest.fn(),
  findWithFilters: jest.fn(),
  checkDuplicates: jest.fn(),
  addContact: jest.fn(),
  syncContacts: jest.fn(),
});

const prepareRepo = (): MockClientRepository => {
  const repo = makeRepo();
  repo.checkDuplicates.mockResolvedValue(null);
  repo.create.mockImplementation((client) =>
    Promise.resolve(makeClient(client)),
  );
  return repo;
};

describe('CreateClientUseCase', () => {
  it('uses the authenticated seller id and ignores sellerId from the payload', async () => {
    const repo = prepareRepo();

    await new CreateClientUseCase(repo).execute({
      dto: { ...baseDto, sellerId: 'seller-payload' },
      user: makeUser(UserRole.Seller, 'seller-authenticated'),
    });

    expect(repo.create.mock.calls).toContainEqual([
      expect.objectContaining({ sellerId: 'seller-authenticated' }),
    ]);
  });

  it.each([UserRole.Admin, UserRole.Director])(
    'uses the payload seller id for %s',
    async (role) => {
      const repo = prepareRepo();

      await new CreateClientUseCase(repo).execute({
        dto: { ...baseDto, sellerId: 'seller-selected' },
        user: makeUser(role),
      });

      expect(repo.create.mock.calls).toContainEqual([
        expect.objectContaining({ sellerId: 'seller-selected' }),
      ]);
    },
  );

  it('rejects a Seller account without an associated seller id', async () => {
    const repo = prepareRepo();

    await expect(
      new CreateClientUseCase(repo).execute({
        dto: baseDto,
        user: makeUser(UserRole.Seller),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.create.mock.calls).toHaveLength(0);
  });

  it.each([UserRole.Admin, UserRole.Director])(
    'requires a payload seller id for %s',
    async (role) => {
      const repo = prepareRepo();

      await expect(
        new CreateClientUseCase(repo).execute({
          dto: baseDto,
          user: makeUser(role),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create.mock.calls).toHaveLength(0);
    },
  );

  it.each([
    ['company name', { name: baseDto.name }],
    ['domain', { domain: baseDto.domain }],
  ])('rejects a duplicate %s', async (_label, duplicate) => {
    const repo = prepareRepo();
    repo.checkDuplicates.mockResolvedValueOnce(makeClient(duplicate));

    await expect(
      new CreateClientUseCase(repo).execute({
        dto: { ...baseDto, sellerId: 'seller-1' },
        user: makeUser(UserRole.Admin),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.checkDuplicates.mock.calls).toContainEqual([
      { name: baseDto.name, domain: baseDto.domain },
    ]);
    expect(repo.create.mock.calls).toHaveLength(0);
  });

  it.each([
    ['phone', { phone: '+52 55 1111 2222' }],
    ['email', { email: 'sales@acme.mx' }],
  ])('rejects an existing contact %s', async (_label, contact) => {
    const repo = prepareRepo();
    const phone = 'phone' in contact ? contact.phone : undefined;
    const email = 'email' in contact ? contact.email : undefined;
    repo.checkDuplicates
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeClient());

    await expect(
      new CreateClientUseCase(repo).execute({
        dto: {
          ...baseDto,
          sellerId: 'seller-1',
          contacts: [{ name: 'Ana Compras', ...contact }],
        },
        user: makeUser(UserRole.Director),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.checkDuplicates.mock.calls.at(-1)).toEqual([{ phone, email }]);
    expect(repo.create.mock.calls).toHaveLength(0);
  });

  it.each([
    [
      'phones',
      [
        { name: 'Ana', phone: '+52 (55) 1234-5678' },
        { name: 'Luis', phone: '525512345678' },
      ],
    ],
    [
      'emails',
      [
        { name: 'Ana', email: ' Ventas@Acme.MX ' },
        { name: 'Luis', email: 'ventas@acme.mx' },
      ],
    ],
  ])(
    'rejects normalized duplicate %s inside the payload',
    async (_label, contacts) => {
      const repo = prepareRepo();

      await expect(
        new CreateClientUseCase(repo).execute({
          dto: { ...baseDto, sellerId: 'seller-1', contacts },
          user: makeUser(UserRole.Admin),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.checkDuplicates.mock.calls).toHaveLength(0);
      expect(repo.create.mock.calls).toHaveLength(0);
    },
  );
});
