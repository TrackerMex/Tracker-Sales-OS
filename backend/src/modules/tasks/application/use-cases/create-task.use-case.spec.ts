import { ConflictException } from '@nestjs/common';
import { TaskEntity, TaskStatus } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { CreateTaskUseCase } from './create-task.use-case';

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

const makeRepo = (): MockTaskRepository =>
  ({
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findTodayBySeller: jest.fn(),
    findMonthAllSellers: jest.fn(),
    findOverdueBySeller: jest.fn(),
    findConflictingTask: jest.fn(),
  }) as MockTaskRepository;

describe('CreateTaskUseCase', () => {
  it('creates a pending task when the time slot is free', async () => {
    const repo = makeRepo();
    repo.findConflictingTask.mockResolvedValue(null);
    repo.create.mockImplementation((task) => Promise.resolve(makeTask(task)));

    const result = await new CreateTaskUseCase(repo).execute({
      sellerId: 'seller-1',
      title: 'Seguimiento',
      scheduledAt,
    });

    expect(repo.findConflictingTask).toHaveBeenCalledWith(
      'seller-1',
      new Date(scheduledAt),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerId: 'seller-1',
        scheduledAt: new Date(scheduledAt),
        status: TaskStatus.Pending,
      }),
    );
    expect(result).toMatchObject({ id: 'task-1', status: TaskStatus.Pending });
  });

  it('rejects an overlapping task without creating it', async () => {
    const repo = makeRepo();
    repo.findConflictingTask.mockResolvedValue(
      makeTask({ id: 'conflict', title: 'Demo existente' }),
    );

    await expect(
      new CreateTaskUseCase(repo).execute({
        sellerId: 'seller-1',
        title: 'Otra demo',
        scheduledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
