import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TaskEntity, TaskStatus } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { CreateTaskUseCase } from './create-task.use-case';
import { ISellerRepository } from '../../../sellers/domain/repositories/seller.repository.interface';
import { SellerEntity } from '../../../sellers/domain/entities/seller.entity';
import { IClientRepository } from '../../../clients/domain/repositories/client.repository.interface';
import { ClientEntity } from '../../../clients/domain/entities/client.entity';
import { TasksController } from '../../presentation/tasks.controller';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { GetTodayTasksUseCase } from './get-today-tasks.use-case';
import { GetTeamTasksUseCase } from './get-team-tasks.use-case';
import { CompleteTaskUseCase } from './complete-task.use-case';
import { UpdateTaskUseCase } from './update-task.use-case';
import { ReactivateTaskUseCase } from './reactivate-task.use-case';
import { DeleteTaskUseCase } from './delete-task.use-case';

type MockTaskRepository = jest.Mocked<ITaskRepository>;

const scheduledAt = '2026-07-14T15:30:00.000Z';

const makeTask = (overrides: Partial<TaskEntity> = {}): TaskEntity =>
  Object.assign(new TaskEntity(), {
    id: 'task-1',
    sellerId: 'seller-1',
    clientId: null,
    type: null,
    contactId: null,
    title: 'Seguimiento',
    description: null,
    scheduledAt: new Date(scheduledAt),
    completedAt: null,
    status: TaskStatus.Pending,
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
    updatedAt: new Date('2026-07-13T10:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  });

const makeRepo = (): MockTaskRepository => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findTodayBySeller: jest.fn(),
  findMonthAllSellers: jest.fn(),
  findOverdueBySeller: jest.fn(),
  findConflictingTask: jest.fn(),
});

const makeSellerRepo = (): jest.Mocked<ISellerRepository> => ({
  findById: jest.fn().mockImplementation((id: string) =>
    Promise.resolve(
      Object.assign(new SellerEntity(), {
        id,
        active: true,
        deletedAt: null,
      }),
    ),
  ),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findAllActive: jest.fn(),
  findAllIncludingInactive: jest.fn(),
});

const makeClientRepo = (): jest.Mocked<IClientRepository> => ({
  findById: jest.fn().mockResolvedValue(
    Object.assign(new ClientEntity(), {
      id: 'client-1',
      sellerId: 'seller-1',
      deletedAt: null,
    }),
  ),
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

describe('CreateTaskUseCase', () => {
  it('creates a pending task when the time slot is free', async () => {
    const repo = makeRepo();
    repo.findConflictingTask.mockResolvedValue(null);
    repo.create.mockImplementation((task) => Promise.resolve(makeTask(task)));

    const result = await new CreateTaskUseCase(
      repo,
      makeSellerRepo(),
      makeClientRepo(),
    ).execute({
      sellerId: 'seller-1',
      title: 'Seguimiento',
      scheduledAt,
    });

    expect(repo.findConflictingTask.mock.calls).toContainEqual([
      'seller-1',
      new Date(scheduledAt),
    ]);
    expect(repo.create.mock.calls).toContainEqual([
      expect.objectContaining({
        sellerId: 'seller-1',
        scheduledAt: new Date(scheduledAt),
        status: TaskStatus.Pending,
      }),
    ]);
    expect(result).toMatchObject({ id: 'task-1', status: TaskStatus.Pending });
  });

  it('rejects an overlapping task without creating it', async () => {
    const repo = makeRepo();
    repo.findConflictingTask.mockResolvedValue(
      makeTask({ id: 'conflict', title: 'Demo existente' }),
    );

    await expect(
      new CreateTaskUseCase(repo, makeSellerRepo(), makeClientRepo()).execute({
        sellerId: 'seller-1',
        title: 'Otra demo',
        scheduledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.create.mock.calls).toHaveLength(0);
  });

  it.each(['missing', 'inactive', 'deleted'])(
    'rejects a %s seller before checking conflicts or writing',
    async (state) => {
      const repo = makeRepo(),
        sellers = makeSellerRepo();
      sellers.findById.mockResolvedValue(
        state === 'missing'
          ? null
          : Object.assign(new SellerEntity(), {
              active: state !== 'inactive',
              deletedAt: state === 'deleted' ? new Date() : null,
            }),
      );
      await expect(
        new CreateTaskUseCase(repo, sellers, makeClientRepo()).execute({
          sellerId: 'seller-1',
          title: 'Task',
          scheduledAt,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.findConflictingTask.mock.calls).toHaveLength(0);
      expect(repo.create.mock.calls).toHaveLength(0);
    },
  );

  it('rejects a client assigned to another seller before writing', async () => {
    const repo = makeRepo(),
      clients = makeClientRepo();
    clients.findById.mockResolvedValue(
      Object.assign(new ClientEntity(), { sellerId: 'seller-other' }),
    );
    await expect(
      new CreateTaskUseCase(repo, makeSellerRepo(), clients).execute({
        sellerId: 'seller-1',
        clientId: 'client-1',
        title: 'Task',
        scheduledAt,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.findConflictingTask.mock.calls).toHaveLength(0);
    expect(repo.create.mock.calls).toHaveLength(0);
  });

  it.each([UserRole.Seller, UserRole.Admin, UserRole.Director])(
    'uses the correct owner for %s through the create controller',
    async (role) => {
      const repo = makeRepo(),
        sellers = makeSellerRepo();
      repo.create.mockImplementation((task) => Promise.resolve(makeTask(task)));
      const controller = new TasksController(
        new CreateTaskUseCase(repo, sellers, makeClientRepo()),
        new GetTodayTasksUseCase(repo),
        new GetTeamTasksUseCase(repo),
        new CompleteTaskUseCase(repo),
        new UpdateTaskUseCase(repo),
        new ReactivateTaskUseCase(repo),
        new DeleteTaskUseCase(repo),
      );
      await controller.create(
        { sellerId: 'selected-owner', title: 'Task', scheduledAt },
        { user: { role, sellerId: 'jwt-owner' } },
      );
      const owner = role === UserRole.Seller ? 'jwt-owner' : 'selected-owner';
      expect(sellers.findById.mock.calls).toContainEqual([owner]);
      expect(repo.create.mock.calls).toContainEqual([
        expect.objectContaining({ sellerId: owner }),
      ]);
    },
  );

  it('rejects a Seller without JWT identity before accessing repositories', () => {
    const repo = makeRepo(),
      sellers = makeSellerRepo();
    const controller = new TasksController(
      new CreateTaskUseCase(repo, sellers, makeClientRepo()),
      new GetTodayTasksUseCase(repo),
      new GetTeamTasksUseCase(repo),
      new CompleteTaskUseCase(repo),
      new UpdateTaskUseCase(repo),
      new ReactivateTaskUseCase(repo),
      new DeleteTaskUseCase(repo),
    );
    expect(() =>
      controller.create(
        { sellerId: 'selected-owner', title: 'Task', scheduledAt },
        { user: { role: UserRole.Seller, sellerId: null } },
      ),
    ).toThrow(ForbiddenException);
    expect(sellers.findById.mock.calls).toHaveLength(0);
    expect(repo.create.mock.calls).toHaveLength(0);
  });
});
