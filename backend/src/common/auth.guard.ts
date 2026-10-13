import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UsersService} from '../users/users.service.js';
import {IS_PUBLIC_KEY, ROLES_KEY} from './auth.decorators.js';
import {Role} from './role.enum.js';

/** Request header that carries the id of the calling user. */
export const USER_ID_HEADER = 'X-User-Id';

/**
 * Stand-in for real authentication (out of scope for exercise 1):
 * the caller is identified by the `X-User-Id` header and their role is
 * read from the stored user, never from the request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Resolves the caller, stores it as `request.user` and checks the roles
   * declared with {@link Roles}. Endpoints marked with {@link Public} are
   * let through without a caller.
   *
   * @param context - Execution context of the current request.
   * @returns `true` if the request may proceed.
   * @throws UnauthorizedException if the header is missing, invalid or names an unknown user.
   * @throws ForbiddenException if the caller lacks a required role.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers[USER_ID_HEADER.toLowerCase()];
    const userId = Number(header);

    if (!header || !Number.isInteger(userId)) {
      throw new UnauthorizedException('Missing or invalid X-User-Id header');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(`Unknown user ${userId}`);
    }
    request.user = user;

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (roles && !roles.includes(user.role)) {
      throw new ForbiddenException(`Requires role ${roles.join(' or ')}`);
    }
    return true;
  }
}
