import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Roles y permisos tal como están ahora en la base de datos
  @Get('yo')
  @UseGuards(JwtAuthGuard)
  yo(@UsuarioActual() usuario: unknown) {
    return usuario;
  }
}