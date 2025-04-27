import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Singleton to store the current request for use in determining base URL
 */
export class RequestStore {
  private static currentRequest: any = null;

  static setRequest(req: any): void {
    RequestStore.currentRequest = req;
  }

  static getRequest(): any {
    return RequestStore.currentRequest;
  }
}

/**
 * Interceptor that captures the current request for use in determining base URL
 */
@Injectable()
export class RequestInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    RequestStore.setRequest(request);
    
    return next.handle().pipe(
      tap(() => {
        // Clear reference after handling to prevent memory leaks
        RequestStore.setRequest(null);
      })
    );
  }
} 