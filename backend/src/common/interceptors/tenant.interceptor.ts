import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Observable, finalize, from, switchMap } from 'rxjs';

/**
 * Sets PostgreSQL session variable app.current_seller_id for the duration of
 * each HTTP request so that RLS policies can enforce seller isolation.
 *
 * Limitation: TypeORM's connection pool means each repo query may use a
 * different connection. This interceptor sets the variable once at request
 * start and resets it at the end, which is sufficient for low-concurrency
 * deployments. For high-concurrency environments, refactor repositories to
 * use DataSource.transaction() with SET LOCAL per query instead.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: { sellerId?: string | null } }>();
    const sellerId: string = request.user?.sellerId ?? '';

    return from(
      this.dataSource.query(
        `SELECT set_config('app.current_seller_id', $1, false)`,
        [sellerId],
      ),
    ).pipe(
      switchMap(() => next.handle()),
      finalize(() => {
        this.dataSource
          .query(`SELECT set_config('app.current_seller_id', '', false)`)
          .catch(() => undefined);
      }),
    );
  }
}
