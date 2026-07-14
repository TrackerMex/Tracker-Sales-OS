import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../../auth/domain/entities/user.entity';
import { TaskEntity, TaskStatus } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories/task.repository.interface';
import { UpdateTaskUseCase } from './update-task.use-case';

type MockTaskRepository = jest.Mocked<ITaskRepository>;

const originalDate = new Date('2026-07-14T15:30:00.000Z');
const newDate = '2026-07-15T16:00:00.000Z';

const makeTask = (overrides: Partial<TaskEntity> = {}): TaskEntity =>
  Object.assign(new TaskEntity(), {
    id: 'task-1',
    sellerId: 'seller-owner',
    clientId: null,
    type: null,
    contactId: null,
    title: 'Seguimiento',
    description: null,
    scheduledAt: originalDate,
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

describe('UpdateTaskUseCase', () => {
  it('excludes the task itself when checking a rescheduled time', async () => {
    const repo = makeRepo();
    const task = makeTask();
    repo.findById.mockResolvedValue(task);
    repo.findConflictingTask.mockResolvedValue(null);
    repo.update.mockResolvedValue(makeTask({ scheduledAt: new Date(newDate) }));

    await new UpdateTaskUseCase(repo).execute({
      taskId: task.id,
      callerRole: UserRole.Seller,
      callerSellerId: task.sellerId,
      scheduledAt: newDate,
    });

    expect(repo.findConflictingTask).toHaveBeenCalledWith(
      task.sellerId,
      new Date(newDate),
      task.id,
    );
    expect(repo.update).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ scheduledAt: new Date(newDate) }),
    );
  });

  it('rejects a conflict found while rescheduling', async () => {
    const repo = makeRepo();
    const task = makeTask();
    repo.findById.mockResolvedValue(task);
    repo.findConflictingTask.mockResolvedValue(
      makeTask({ id: 'other-task', title: 'Horario ocupado' }),
    );

    await expect(
      new UpdateTaskUseCase(repo).execute({
        taskId: task.id,
        callerRole: UserRole.Seller,
        callerSellerId: task.sellerId,
        scheduledAt: newDate,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects a Seller editing another seller task', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeTask());

    await expect(
      new UpdateTaskUseCase(repo).execute({
        taskId: 'task-1',
        callerRole: UserRole.Seller,
        callerSellerId: 'seller-other',
        title: 'Cambio no autorizado',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it.each([UserRole.Admin, UserRole.Director])(
    'allows %s to edit a task without seller ownership',
    async (callerRole) => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeTask());
      repo.update.mockResolvedValue(makeTask({ title: 'Actualizada' }));

      await new UpdateTaskUseCase(repo).execute({
        taskId: 'task-1',
        callerRole,
        callerSellerId: null,
        title: 'Actualizada',
      });

      expect(repo.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: 'Actualizada' }),
      );
    },
  );
});
