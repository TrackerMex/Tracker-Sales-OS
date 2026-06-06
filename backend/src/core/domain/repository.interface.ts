export interface FindAllOptions {
  page?: number;
  limit?: number;
  where?: Record<string, unknown>;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<{ data: T[]; total: number }>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
}
