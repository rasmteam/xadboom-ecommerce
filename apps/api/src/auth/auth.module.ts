import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthGuard, RolesGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.AUTH_SECRET;
        if (!secret || secret.length < 16) throw new Error("AUTH_SECRET must be set (16+ chars)");
        return { secret, signOptions: { expiresIn: "7d", algorithm: "HS256" } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthService, AuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
