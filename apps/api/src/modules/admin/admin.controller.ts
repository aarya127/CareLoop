import { Controller, Get, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
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
