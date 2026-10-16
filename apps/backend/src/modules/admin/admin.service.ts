import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentVerificationService } from './payment-verification.service';
import { AdminStatsService, AdminDashboardStats, AgentDashboardStats } from './admin-stats.service';
import { UpdateStaffSettingsDto } from './dto/update-staff-settings.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

export { AdminDashboardStats, AgentDashboardStats };

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly paymentVerificationService: PaymentVerificationService,
    private readonly adminStatsService: AdminStatsService,
  ) {}

  /**
   * Delegated: Get admin dashboard statistics
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return this.adminStatsService.getDashboardStats();
  }

  /**
   * Delegated: Get all payments (with filters)
   */
  async getPayments(status?: PaymentStatus, page = 1, limit = 20) {
    return this.paymentVerificationService.getPayments(status, page, limit);
  }

  /**
   * Delegated: Verify a payment
   */
  async verifyPayment(paymentId: string, adminUserId: string, adminRole: string) {
    return this.paymentVerificationService.verifyPayment(paymentId, adminUserId, adminRole);
  }

  /**
   * Delegated: Get pending payments
   */
  async getPendingPayments(userRole?: string) {
    return this.paymentVerificationService.getPendingPayments(userRole);
  }

  /**
   * Get recent audit logs
   */
  async getAuditLogs(
    page = 1,
    limit = 50,
  ): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const [logs, total] = await this.auditLogRepository.findAndCount({
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Delegated: Get dashboard stats for Owner/Agent
   */
  async getAgentDashboardStats(userId: string): Promise<AgentDashboardStats> {
    return this.adminStatsService.getAgentDashboardStats(userId);
  }

  /**
   * Allowed staff roles for management by Super Admin
   */
  private readonly staffRoles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.AGENT,
  ];

  /**
   * Helper to strip sensitive fields from a user entity
   */
  private sanitizeUser(user: User): Omit<User, 'password'> {
    const safeUser = { ...user };
    delete (safeUser as any).password;
    return safeUser;
  }

  /**
   * Get paginated staff users (Super Admin only)
   */
  async getStaffUsers(options: {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
  }): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, Number(options.page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(options.limit) || 20));

    if (options.role && !this.staffRoles.includes(options.role)) {
      throw new BadRequestException(
        `Role must be one of staff roles: ${this.staffRoles.join(', ')}`,
      );
    }

    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.memberId',
        'user.fullName',
        'user.mobileNumber',
        'user.email',
        'user.role',
        'user.isActive',
        'user.isKycVerified',
        'user.isTwoFactorEnabled',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (options.role) {
      qb.where('user.role = :role', { role: options.role });
    } else {
      qb.where('user.role IN (:...roles)', { roles: this.staffRoles });
    }

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.fullName) LIKE :term OR LOWER(user.mobileNumber) LIKE :term OR LOWER(user.email) LIKE :term OR LOWER(user.memberId) LIKE :term)',
        { term },
      );
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [users, total] = await qb.getManyAndCount();

    return {
      users: users.map((u) => this.sanitizeUser(u)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Reset staff password (Super Admin only)
   */
  async resetStaffPassword(
    targetUserId: string,
    newPassword: string,
    currentUserId: string,
  ): Promise<{ message: string; memberId: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Staff user not found');
    }

    if (!this.staffRoles.includes(targetUser.role)) {
      throw new BadRequestException('Target user is not a staff member');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    targetUser.password = hashedPassword;
    await this.userRepository.save(targetUser);

    await this.auditLogRepository.save({
      performedById: currentUserId,
      action: 'STAFF_PASSWORD_RESET',
      entity: 'User',
      entityId: targetUserId,
      newValue: {
        targetMemberId: targetUser.memberId,
        role: targetUser.role,
      },
    });

    this.logger.log(
      `Super admin ${currentUserId} reset password for staff user ${targetUser.memberId}`,
    );

    return {
      message: 'Staff password reset successfully',
      memberId: targetUser.memberId,
    };
  }

  /**
   * Update staff active status (Super Admin only)
   */
  async updateStaffStatus(
    targetUserId: string,
    isActive: boolean,
    currentUserId: string,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Staff user not found');
    }

    if (!this.staffRoles.includes(targetUser.role)) {
      throw new BadRequestException('Target user is not a staff member');
    }

    if (targetUserId === currentUserId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own super admin account');
    }

    const previousStatus = targetUser.isActive;
    targetUser.isActive = isActive;
    await this.userRepository.save(targetUser);

    if (targetUser.role === UserRole.AGENT) {
      const agent = await this.agentRepository.findOne({
        where: { userId: targetUser.id },
      });
      if (agent) {
        agent.isActive = isActive;
        await this.agentRepository.save(agent);
      }
    }

    await this.auditLogRepository.save({
      performedById: currentUserId,
      action: isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
      entity: 'User',
      entityId: targetUserId,
      oldValue: { isActive: previousStatus },
      newValue: { isActive },
    });

    this.logger.log(
      `Super admin ${currentUserId} set staff user ${targetUser.memberId} isActive to ${isActive}`,
    );

    return {
      message: `Staff user ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: this.sanitizeUser(targetUser),
    };
  }

  /**
   * Update staff settings (Super Admin only)
   */
  async updateStaffSettings(
    targetUserId: string,
    dto: UpdateStaffSettingsDto,
    currentUserId: string,
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Staff user not found');
    }

    if (!this.staffRoles.includes(targetUser.role)) {
      throw new BadRequestException('Target user is not a staff member');
    }

    if (targetUserId === currentUserId && dto.role && dto.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('You cannot demote your own super admin role');
    }

    if (dto.role && !this.staffRoles.includes(dto.role)) {
      throw new BadRequestException(
        `Role must be one of staff roles: ${this.staffRoles.join(', ')}`,
      );
    }

    if (dto.mobileNumber && dto.mobileNumber !== targetUser.mobileNumber) {
      const existing = await this.userRepository.findOne({
        where: { mobileNumber: dto.mobileNumber },
      });
      if (existing && existing.id !== targetUserId) {
        throw new BadRequestException('Mobile number already in use');
      }
      targetUser.mobileNumber = dto.mobileNumber;
    }

    if (dto.email && dto.email !== targetUser.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== targetUserId) {
        throw new BadRequestException('Email already in use');
      }
      targetUser.email = dto.email;
    }

    if (dto.fullName !== undefined) {
      targetUser.fullName = dto.fullName;
    }

    if (dto.role !== undefined) {
      targetUser.role = dto.role;
    }

    if (dto.isTwoFactorEnabled !== undefined) {
      targetUser.isTwoFactorEnabled = dto.isTwoFactorEnabled;
    }

    await this.userRepository.save(targetUser);

    await this.auditLogRepository.save({
      performedById: currentUserId,
      action: 'STAFF_UPDATED',
      entity: 'User',
      entityId: targetUserId,
      newValue: {
        fullName: targetUser.fullName,
        role: targetUser.role,
        mobileNumber: targetUser.mobileNumber,
        email: targetUser.email,
        isTwoFactorEnabled: targetUser.isTwoFactorEnabled,
      },
    });

    this.logger.log(
      `Super admin ${currentUserId} updated settings for staff user ${targetUser.memberId}`,
    );

    return {
      message: 'Staff settings updated successfully',
      user: this.sanitizeUser(targetUser),
    };
  }

  /**
   * Helper to generate a default password: first 3 letters of name + last 6 digits of mobile
   */
  private generatePassword(fullName: string, mobileNumber: string): string {
    const namePart = fullName.replace(/\s+/g, '').substring(0, 3).toLowerCase();
    const mobilePart = mobileNumber.replace(/\D/g, '').slice(-6);
    return `${namePart}${mobilePart}`;
  }

  /**
   * Create a new Admin account (Super Admin only)
   */
  async createAdmin(
    dto: CreateAdminDto,
    currentUserId: string,
  ): Promise<{
    message: string;
    user: Omit<User, 'password'>;
    temporaryPassword?: string;
  }> {
    const mobile = dto.mobileNumber.trim();
    const existingMobile = await this.userRepository.findOne({
      where: { mobileNumber: mobile },
    });
    if (existingMobile) {
      throw new ConflictException('A user with this mobile number already exists');
    }

    if (dto.email && dto.email.trim()) {
      const email = dto.email.trim().toLowerCase();
      const existingEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const count = await this.userRepository.count({
      where: { role: UserRole.ADMIN },
    });
    const memberId = `ATB-${currentYear}-AD-${count + 1}`;

    const rawPassword = dto.password?.trim() || this.generatePassword(dto.fullName, mobile);
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const admin = this.userRepository.create({
      memberId,
      fullName: dto.fullName.trim(),
      mobileNumber: mobile,
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isKycVerified: true,
      isTwoFactorEnabled: Boolean(dto.isTwoFactorEnabled),
      permanentAddress: dto.permanentAddress?.trim() || undefined,
    });

    const savedAdmin = await this.userRepository.save(admin);

    await this.auditLogRepository.save({
      performedById: currentUserId,
      action: 'STAFF_ADMIN_CREATED',
      entity: 'User',
      entityId: savedAdmin.id,
      newValue: {
        memberId: savedAdmin.memberId,
        fullName: savedAdmin.fullName,
        role: savedAdmin.role,
        mobileNumber: savedAdmin.mobileNumber,
        email: savedAdmin.email,
      },
    });

    this.logger.log(
      `Super admin ${currentUserId} created new admin account ${savedAdmin.memberId}`,
    );

    return {
      message: 'Admin account created successfully',
      user: this.sanitizeUser(savedAdmin),
      temporaryPassword: dto.password ? undefined : rawPassword,
    };
  }
}
