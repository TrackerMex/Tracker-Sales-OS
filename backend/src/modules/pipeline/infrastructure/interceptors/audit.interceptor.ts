import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{
        body: { newStage: string; changedBy: string };
        params: { id: string };
      }>();
    const requestedNewStage = req.body.newStage;
    const changedBy = req.body.changedBy;
    const dealId = req.params.id;

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
