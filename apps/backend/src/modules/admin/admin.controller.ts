import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentStatus } from '../../entities/payment.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { FraudService } from './fraud.service';
import { ResetStaffPasswordDto } from './dto/reset-staff-password.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { UpdateStaffSettingsDto } from './dto/update-staff-settings.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly fraudService: FraudService,
  ) {}

  /**
   * GET /api/admin/dashboard
   * Dashboard statistics
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return this.adminService.getDashboardStats();
    }
    if (user.role === UserRole.OWNER || user.role === UserRole.AGENT) {
      return this.adminService.getAgentDashboardStats(user.sub);
    }
    return {
      members: { total: 0 },
      payments: { totalCollection: 0 },
      claims: { submitted: 0 },
      agents: { total: 0 },
    };
  }

  /**
   * GET /api/admin/payments
   * List all payments with optional status filter
   */
  @Get('payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPayments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.adminService.getPayments(status, page, limit);
  }

  /**
   * GET /api/admin/payments/pending
   * Get all pending payments that need verification
   */
  @Get('payments/pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPendingPayments(@CurrentUser() user: JwtPayload) {
    return this.adminService.getPendingPayments(user.role);
  }

  /**
   * POST /api/admin/payments/:id/verify
   * Verify a payment (Maker role)
   */
  @Post('payments/:id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async verifyPayment(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.verifyPayment(id, user.sub, user.role);
  }

  /**
   * GET /api/admin/audit-logs
   * View audit logs
   */
  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN)
  async getAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAuditLogs(page, limit);
  }

  /**
   * GET /api/admin/fraud-check — Run all fraud checks
   */
  @Get('fraud-check')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async runFraudChecks(@CurrentUser() _user: JwtPayload) {
    // Admin gets view-only results, SA gets full results with action buttons
    return this.fraudService.runFraudChecks();
  }

  /**
   * GET /api/admin/fraud-check/:userId — Check specific user
   */
  @Get('fraud-check/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async checkUserFraud(@Param('userId') userId: string) {
    return this.fraudService.checkUser(userId);
  }

  /**
   * GET /api/admin/staff
   * List staff members (SUPER_ADMIN only)
   */
  @Get('staff')
  @Roles(UserRole.SUPER_ADMIN)
  async getStaff(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.adminService.getStaffUsers({ page, limit, role, search });
  }

  /**
   * PUT /api/admin/staff/:id/password
   * Reset staff password (SUPER_ADMIN only)
   */
  @Put('staff/:id/password')
  @Roles(UserRole.SUPER_ADMIN)
  async resetStaffPassword(
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.resetStaffPassword(id, dto.newPassword, user.sub);
  }

  /**
   * PUT /api/admin/staff/:id/status
   * Toggle staff active status (SUPER_ADMIN only)
   */
  @Put('staff/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  async updateStaffStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateStaffStatus(id, dto.isActive, user.sub);
  }

  /**
   * PUT /api/admin/staff/:id
   * Update staff settings (SUPER_ADMIN only)
   */
  @Put('staff/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async updateStaffSettings(
    @Param('id') id: string,
    @Body() dto: UpdateStaffSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.updateStaffSettings(id, dto, user.sub);
  }

  /**
   * POST /api/admin/staff/admins
   * Create a new Admin account (SUPER_ADMIN only)
   */
  @Post('staff/admins')
  @Roles(UserRole.SUPER_ADMIN)
  async createAdmin(@Body() dto: CreateAdminDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createAdmin(dto, user.sub);
  }
}
