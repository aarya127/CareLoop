import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AUTH_ROLES } from '../auth/auth.constants';
import { AuthGuard, RequireRole, RolesGuard } from '../../common/guards';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole(AUTH_ROLES.ADMIN)
  findAll(@Req() req: any) {
    return this.usersService.findAll(req.user.practiceId);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole(AUTH_ROLES.ADMIN)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findById(req.user.practiceId, id);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole(AUTH_ROLES.ADMIN)
  update(@Param('id') id: string, @Req() req: any, @Body() dto: any) {
    return this.usersService.update(req.user.practiceId, id, dto);
  }

  @Post(':id/remove')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole(AUTH_ROLES.ADMIN)
  remove(@Param('id') id: string, @Req() req: any, @Body() body: { reason?: string }) {
    return this.usersService.remove(req.user.practiceId, id, body?.reason);
  }
}
