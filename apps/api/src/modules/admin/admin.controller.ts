import { Controller, Get, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RequireRole } from '../../common/guards';
import { AUTH_ROLES } from '../auth/auth.constants';

// System administration — admin only.
@Controller('admin')
@RequireRole(AUTH_ROLES.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getSystemStats();
  }

  @Post('settings')
  updateSettings(@Body() dto: any) {
    return this.adminService.updateSettings(dto);
  }
}
