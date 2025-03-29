import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
  } from '@nestjs/common';

  import { Request } from 'express';
  
  @Injectable()
  export class UserUpdateGuard implements CanActivate {
    constructor() {}
  
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>();
      const user = (request as any).user;
      const targetUserId = request.params.id;
  
      if (!user || !targetUserId) {
        throw new ForbiddenException('Invalid request');
      }
  
      const isOwner = user.id === targetUserId;
      const canUpdateAny = user.claims?.some((c: any) => c.name === 'user:update:any');
  
      if (!isOwner && !canUpdateAny) {
        throw new ForbiddenException('You are not allowed to update this user.');
      }
  
      return true;
    }
  }
  