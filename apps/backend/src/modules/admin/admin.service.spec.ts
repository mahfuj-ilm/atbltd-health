import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentStatus } from '../../entities/payment.entity';
import { PaymentVerificationService } from './payment-verification.service';
import { AdminStatsService } from './admin-stats.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockUserRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((data) => ({ ...data, id: 'admin-uuid-created' })),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    }),
  };

  const mockAgentRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockPaymentVerificationService = {
    getPayments: jest.fn(),
    verifyPayment: jest.fn(),
    getPendingPayments: jest.fn(),
  };

  const mockAdminStatsService = {
    getDashboardStats: jest.fn(),
    getAgentDashboardStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: PaymentVerificationService, useValue: mockPaymentVerificationService },
        { provide: AdminStatsService, useValue: mockAdminStatsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should delegate to AdminStatsService.getDashboardStats', async () => {
      const mockStats = {
        members: { total: 10, active: 8, inactive: 2, newThisMonth: 3 },
        payments: { totalCollection: 5000, pendingVerification: 2, verifiedToday: 1 },
        claims: { submitted: 4, pending: 1, approved: 2, rejected: 1 },
        agents: { total: 5, active: 4 },
      };
      mockAdminStatsService.getDashboardStats.mockResolvedValueOnce(mockStats);

      const stats = await service.getDashboardStats();

      expect(mockAdminStatsService.getDashboardStats).toHaveBeenCalled();
      expect(stats).toEqual(mockStats);
    });
  });

  describe('Delegation to PaymentVerificationService', () => {
    it('should delegate getPayments', async () => {
      const mockResult = { payments: [], total: 0, page: 1, totalPages: 0 };
      mockPaymentVerificationService.getPayments.mockResolvedValueOnce(mockResult);

      const result = await service.getPayments(PaymentStatus.PENDING, 1, 20);

      expect(mockPaymentVerificationService.getPayments).toHaveBeenCalledWith(
        PaymentStatus.PENDING,
        1,
        20,
      );
      expect(result).toBe(mockResult);
    });

    it('should delegate verifyPayment', async () => {
      const mockResponse = { success: true, message: 'Verified' };
      mockPaymentVerificationService.verifyPayment.mockResolvedValueOnce(mockResponse);

      const result = await service.verifyPayment('payment-1', 'admin-uuid', UserRole.ADMIN);

      expect(mockPaymentVerificationService.verifyPayment).toHaveBeenCalledWith(
        'payment-1',
        'admin-uuid',
        UserRole.ADMIN,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delegate getPendingPayments for Admin', async () => {
      mockPaymentVerificationService.getPendingPayments.mockResolvedValueOnce([]);

      const result = await service.getPendingPayments(UserRole.ADMIN);

      expect(mockPaymentVerificationService.getPendingPayments).toHaveBeenCalledWith(
        UserRole.ADMIN,
      );
      expect(result).toEqual([]);
    });

    it('should delegate getPendingPayments for Super Admin', async () => {
      mockPaymentVerificationService.getPendingPayments.mockResolvedValueOnce([]);

      const result = await service.getPendingPayments(UserRole.SUPER_ADMIN);

      expect(mockPaymentVerificationService.getPendingPayments).toHaveBeenCalledWith(
        UserRole.SUPER_ADMIN,
      );
      expect(result).toEqual([]);
    });
  });

  describe('getAgentDashboardStats', () => {
    it('should delegate to AdminStatsService.getAgentDashboardStats', async () => {
      const mockStats = {
        members: { total: 10, active: 7 },
        commissions: { totalEarned: 500, totalPaid: 200 },
        agents: { total: 3 },
      };
      mockAdminStatsService.getAgentDashboardStats.mockResolvedValueOnce(mockStats);

      const result = await service.getAgentDashboardStats('user-uuid');

      expect(mockAdminStatsService.getAgentDashboardStats).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      mockAuditLogRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.getAuditLogs(1, 50);

      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getStaffUsers', () => {
    it('returns paginated staff users with passwords stripped', async () => {
      const mockUsers = [
        { id: 'u1', memberId: 'ATB-26-SA-1', role: UserRole.SUPER_ADMIN, password: 'secret' },
        { id: 'u2', memberId: 'ATB-26-AD-1', role: UserRole.ADMIN, password: 'secret' },
      ];
      const qb = mockUserRepository.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValueOnce([mockUsers, 2]);

      const result = await service.getStaffUsers({ page: 1, limit: 10 });

      expect(result.total).toBe(2);
      expect(result.users.length).toBe(2);
      expect((result.users[0] as any).password).toBeUndefined();
      expect(result.totalPages).toBe(1);
    });

    it('filters by staff role and applies search', async () => {
      const qb = mockUserRepository.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValueOnce([[], 0]);

      await service.getStaffUsers({ role: UserRole.ADMIN, search: 'Admin' });

      expect(qb.where).toHaveBeenCalledWith('user.role = :role', { role: UserRole.ADMIN });
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('throws BadRequestException for non-staff role', async () => {
      await expect(service.getStaffUsers({ role: UserRole.MEMBER })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetStaffPassword', () => {
    it('successfully resets password and creates audit log', async () => {
      const targetUser = {
        id: 'staff-1',
        memberId: 'ATB-26-AD-1',
        role: UserRole.ADMIN,
        password: 'old-hashed-password',
      };
      mockUserRepository.findOne.mockResolvedValueOnce(targetUser);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await service.resetStaffPassword('staff-1', 'newSecurePassword123', 'sa-id');

      expect(result.message).toBe('Staff password reset successfully');
      expect(result.memberId).toBe('ATB-26-AD-1');
      expect(targetUser.password).not.toBe('old-hashed-password');
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          performedById: 'sa-id',
          action: 'STAFF_PASSWORD_RESET',
          entityId: 'staff-1',
        }),
      );
    });

    it('throws BadRequestException if password is shorter than 6 characters', async () => {
      await expect(service.resetStaffPassword('staff-1', 'short', 'sa-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if staff user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.resetStaffPassword('not-found', 'newPassword123', 'sa-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if target user is not staff', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'member-1',
        role: UserRole.MEMBER,
      });

      await expect(
        service.resetStaffPassword('member-1', 'newPassword123', 'sa-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStaffStatus', () => {
    it('activates or deactivates a staff member and writes audit log', async () => {
      const targetUser = {
        id: 'admin-1',
        memberId: 'ATB-26-AD-1',
        role: UserRole.ADMIN,
        isActive: true,
      };
      mockUserRepository.findOne.mockResolvedValueOnce(targetUser);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await service.updateStaffStatus('admin-1', false, 'sa-id');

      expect(result.message).toBe('Staff user deactivated successfully');
      expect(targetUser.isActive).toBe(false);
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STAFF_DEACTIVATED',
          performedById: 'sa-id',
        }),
      );
    });

    it('syncs agent active status when target user is an agent', async () => {
      const targetUser = {
        id: 'agent-user-1',
        memberId: 'ATB-26-AG-1',
        role: UserRole.AGENT,
        isActive: false,
      };
      const agentRecord = { id: 'agent-1', userId: 'agent-user-1', isActive: false };
      mockUserRepository.findOne.mockResolvedValueOnce(targetUser);
      mockUserRepository.save.mockImplementation(async (u) => u);
      mockAgentRepository.findOne.mockResolvedValueOnce(agentRecord);
      mockAgentRepository.save = jest.fn().mockResolvedValue(agentRecord);

      await service.updateStaffStatus('agent-user-1', true, 'sa-id');

      expect(agentRecord.isActive).toBe(true);
      expect(mockAgentRepository.save).toHaveBeenCalledWith(agentRecord);
    });

    it('prevents super admin from deactivating their own account', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'sa-id',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      });

      await expect(service.updateStaffStatus('sa-id', false, 'sa-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.updateStaffStatus('unknown', true, 'sa-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if user is not staff', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'member-1',
        role: UserRole.MEMBER,
      });

      await expect(service.updateStaffStatus('member-1', false, 'sa-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStaffSettings', () => {
    it('updates staff settings and writes audit log', async () => {
      const targetUser = {
        id: 'admin-1',
        memberId: 'ATB-26-AD-1',
        role: UserRole.ADMIN,
        fullName: 'Old Admin',
        mobileNumber: '01700000001',
        email: 'old@example.com',
        isTwoFactorEnabled: false,
      };
      mockUserRepository.findOne.mockResolvedValueOnce(targetUser);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await service.updateStaffSettings(
        'admin-1',
        { fullName: 'New Admin', isTwoFactorEnabled: true },
        'sa-id',
      );

      expect(result.message).toBe('Staff settings updated successfully');
      expect(targetUser.fullName).toBe('New Admin');
      expect(targetUser.isTwoFactorEnabled).toBe(true);
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STAFF_UPDATED',
          performedById: 'sa-id',
        }),
      );
    });

    it('prevents super admin from demoting their own role', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'sa-id',
        role: UserRole.SUPER_ADMIN,
      });

      await expect(
        service.updateStaffSettings('sa-id', { role: UserRole.ADMIN }, 'sa-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if role is not a staff role', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'admin-1',
        role: UserRole.ADMIN,
      });

      await expect(
        service.updateStaffSettings('admin-1', { role: UserRole.MEMBER }, 'sa-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if duplicate mobile number is detected', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ id: 'admin-1', role: UserRole.ADMIN, mobileNumber: '01700000001' })
        .mockResolvedValueOnce({ id: 'other-user', mobileNumber: '01700000002' });

      await expect(
        service.updateStaffSettings('admin-1', { mobileNumber: '01700000002' }, 'sa-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if duplicate email is detected', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ id: 'admin-1', role: UserRole.ADMIN, email: 'admin@example.com' })
        .mockResolvedValueOnce({ id: 'other-user', email: 'duplicate@example.com' });

      await expect(
        service.updateStaffSettings('admin-1', { email: 'duplicate@example.com' }, 'sa-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if staff user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateStaffSettings('unknown', { fullName: 'Name' }, 'sa-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if target user is not staff', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'member-1',
        role: UserRole.MEMBER,
      });

      await expect(
        service.updateStaffSettings('member-1', { fullName: 'Name' }, 'sa-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createAdmin', () => {
    it('successfully creates admin with custom password and creates audit log', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // mobile check
      mockUserRepository.findOne.mockResolvedValueOnce(null); // email check
      mockUserRepository.count.mockResolvedValueOnce(2);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await service.createAdmin(
        {
          fullName: 'New Admin Officer',
          mobileNumber: '01799999999',
          email: 'newadmin@atbltd.health',
          password: 'customSecret123',
          isTwoFactorEnabled: true,
        },
        'sa-id',
      );

      expect(result.message).toBe('Admin account created successfully');
      expect(result.user.fullName).toBe('New Admin Officer');
      expect(result.user.memberId).toMatch(/^ATB-\d{2}-AD-3$/);
      expect((result.user as any).password).toBeUndefined();
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          performedById: 'sa-id',
          action: 'STAFF_ADMIN_CREATED',
        }),
      );
    });

    it('successfully creates admin with auto-generated password when password is not supplied', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // mobile check
      mockUserRepository.count.mockResolvedValueOnce(0);
      mockUserRepository.save.mockImplementation(async (u) => u);

      const result = await service.createAdmin(
        {
          fullName: 'Second Admin Officer',
          mobileNumber: '01712345678',
        },
        'sa-id',
      );

      expect(result.message).toBe('Admin account created successfully');
      expect(result.temporaryPassword).toBe('sec345678');
      expect(result.user.memberId).toMatch(/^ATB-\d{2}-AD-1$/);
    });

    it('throws ConflictException if mobile number already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'existing-id',
        mobileNumber: '01799999999',
      });

      await expect(
        service.createAdmin({ fullName: 'Duplicate Mobile', mobileNumber: '01799999999' }, 'sa-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // mobile check
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 'existing-id',
        email: 'duplicate@atbltd.health',
      });

      await expect(
        service.createAdmin(
          {
            fullName: 'Duplicate Email',
            mobileNumber: '01788888888',
            email: 'duplicate@atbltd.health',
          },
          'sa-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
