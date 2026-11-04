import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { verifyPassword, type Role } from "@xadboom/db";
import { PrismaService } from "../prisma/prisma.module";

export const SESSION_COOKIE = "xb_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthUser = { id: string; email: string; name: string; role: Role };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.db.user.findUnique({ where: { email } });
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) throw new UnauthorizedException("Incorrect email or password.");
    await this.prisma.db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  /**
   * The cookie only proves who logged in. Role and existence are re-read from the database on every
   * request, so a demoted or deleted user loses access immediately.
   */
  async userFromToken(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;
    let sub: string;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: string }>(token, { algorithms: ["HS256"] }));
    } catch {
      return null;
    }
    return this.prisma.db.user.findUnique({
      where: { id: sub },
      select: { id: true, email: true, name: true, role: true },
    });
  }
}
