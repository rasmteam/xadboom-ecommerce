import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiCookieAuth } from "@nestjs/swagger";
import type { Request } from "express";
import type { Role } from "@xadboom/db";
import { AuthService, SESSION_COOKIE, type AuthUser } from "./auth.service";

type AuthedRequest = Request & { user?: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.auth.userFromToken(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    return true;
  }
}

const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}

/** Require a signed-in user; pass roles to restrict further, e.g. @Auth("ADMIN", "EDITOR"). */
export const Auth = (...roles: Role[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(AuthGuard, RolesGuard), ApiCookieAuth("xb_session"));

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as AuthUser;
});
