import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import type {User} from '../users/user.entity.js';
import type {UsersService} from '../users/users.service.js';
import {IS_PUBLIC_KEY, ROLES_KEY} from './auth.decorators.js';
import {AuthGuard} from './auth.guard.js';
import {Role} from './role.enum.js';

const users: User[] = [
  {id: 1, name: 'Admin', role: Role.ADMIN},
  {id: 2, name: 'Anna', role: Role.USER},
];

function contextFor(headers: Record<string, string>) {
  const request: Record<string, any> = {headers};
  const context = {
    switchToHttp: () => ({getRequest: () => request}),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
  return {context, request};
}

describe('AuthGuard', () => {
  let reflector: Reflector;
  let guard: AuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    const usersService = {
      findById: async (id: number) => users.find(u => u.id === id) ?? null,
    } as UsersService;
    guard = new AuthGuard(reflector, usersService);
  });

  it('rejects a missing header', async () => {
    const {context} = contextFor({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown user', async () => {
    const {context} = contextFor({'x-user-id': '99'});
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches the caller to the request', async () => {
    const {context, request} = contextFor({'x-user-id': '2'});
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(users[1]);
  });

  it('enforces @Roles using the stored role', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation(key =>
      key === ROLES_KEY ? [Role.ADMIN] : undefined,
    );

    await expect(
      guard.canActivate(contextFor({'x-user-id': '2'}).context),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(contextFor({'x-user-id': '1'}).context),
    ).resolves.toBe(true);
  });

  it('lets @Public endpoints through without a header', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation(
      key => key === IS_PUBLIC_KEY,
    );
    await expect(guard.canActivate(contextFor({}).context)).resolves.toBe(true);
  });
});
