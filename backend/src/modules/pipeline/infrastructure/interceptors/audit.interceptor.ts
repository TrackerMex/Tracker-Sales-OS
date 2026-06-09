import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogTypeormEntity } from '../../../../core/infrastructure/entities/audit-log.typeorm.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLogTypeormEntity)
    private readonly auditLogRepository: Repository<AuditLogTypeormEntity>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{
        body: { newStage: string; changedBy: string };
        params: { id: string };
        user?: { sub: string };
      }>();
    const requestedNewStage = req.body.newStage;
    const changedBy = req.body.changedBy;
    const dealId = req.params.id;
    const userId = req.user?.sub || null;

    return next.handle().pipe(
      tap(
        (
          data: {
            stage: string;
            stageHistory: Array<{ stage: string }>;
          } | null,
        ) => {
          if (!data) return;
          const history = data.stageHistory ?? [];
          const oldStage =
            history.length >= 2 ? history[history.length - 2].stage : 'initial';

          // Save to audit_logs table
          this.auditLogRepository
            .save({
              userId,
              action: 'change_stage',
              entityName: 'deal',
              entityId: dealId,
              oldValues: { stage: oldStage },
              newValues: { stage: requestedNewStage },
            })
            .catch((err) => {
              console.error('[Audit] Failed to save audit log:', err);
            });

          console.log('[Audit] deal stage change', {
            dealId,
            oldStage,
            newStage: requestedNewStage,
            changedBy,
            resultStage: data.stage,
          });
        },
      ),
    );
  }
}
