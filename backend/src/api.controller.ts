import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiService, SessionDto } from './api.service';
import { AuthUser, JwtGuard } from './jwt.guard';

@Controller()
export class ApiController {
  constructor(private readonly api: ApiService) {}

  @Post('auth/login')
  login(@Body() body: { email?: string; password?: string }) {
    return this.api.login(body.email ?? '', body.password ?? '');
  }

  @Get('sessions')
  @UseGuards(JwtGuard)
  sessions(@Req() req: Request & { user: AuthUser }) {
    return this.api.listSessions(req.user.sub);
  }

  @Post('sessions')
  @UseGuards(JwtGuard)
  createSession(@Req() req: Request & { user: AuthUser }, @Body() body: SessionDto) {
    return this.api.createSession(req.user.sub, body);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtGuard)
  async deleteSession(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    const ok = await this.api.deleteSession(req.user.sub, id);
    if (!ok) throw new NotFoundException('Session introuvable');
    return { success: true };
  }
}
