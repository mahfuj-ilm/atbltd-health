import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import { ClaimService } from './claim.service';
import { Claim } from '../../entities/claim.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ClaimDocument } from '../../entities/claim-document.entity';
import { User } from '../../entities/user.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationService } from '../notification/notification.service';
import { SmsService } from '../sms/sms.service';

describe('ClaimService Queries & Role Workflow Branches', () => {
  let service: ClaimService;

  const mockClaimRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
  };

  const mockMembershipRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockPaymentRepository = {
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    save: jest.fn(),
  };

  const mockClaimDocumentRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationService = {
    notifyRoles: jest.fn().mockResolvedValue(undefined),
    notifyUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockSmsService = {
    sendSms: jest.fn().mockResolvedValue({ success: true }),
    sendClaimStatusSms: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimService,
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        { provide: getRepositoryToken(Membership), useValue: mockMembershipRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: getRepositoryToken(ClaimDocument), useValue: mockClaimDocumentRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<ClaimService>(ClaimService);
    jest.clearAllMocks();
  });

  describe('getMemberClaims', () => {
    it('returns member claims ordered by creation descending', async () => {
      const sampleClaims = [{ id: 'claim-1', memberId: 'member-123' }];
      mockClaimRepository.find.mockResolvedValueOnce(sampleClaims);

      const result = await service.getMemberClaims('member-123');
      expect(result).toEqual(sampleClaims);
      expect(mockClaimRepository.find).toHaveBeenCalledWith({
        where: { memberId: 'member-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getClaimById', () => {
    it('returns claim for an administrator without member scoping', async () => {
      const claim = { id: 'claim-1', memberId: 'member-1' };
      mockClaimRepository.findOne.mockResolvedValueOnce(claim);

      const result = await service.getClaimById('claim-1', 'admin-1', UserRole.ADMIN);
      expect(result).toBe(claim);
      expect(mockClaimRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        relations: ['member'],
      });
    });

    it('scopes query to memberId when user has MEMBER role', async () => {
      const claim = { id: 'claim-1', memberId: 'member-1' };
      mockClaimRepository.findOne.mockResolvedValueOnce(claim);

      const result = await service.getClaimById('claim-1', 'member-1', UserRole.MEMBER);
      expect(result).toBe(claim);
      expect(mockClaimRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'claim-1', memberId: 'member-1' },
        relations: ['member'],
      });
    });

    it('throws NotFoundException when claim does not exist', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.getClaimById('nonexistent', 'admin-1', UserRole.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllClaims filters & roles', () => {
    it('filters for ADMIN role by unreviewed claims', async () => {
      mockClaimRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.getAllClaims({
        reviewerRole: UserRole.ADMIN,
        status: ClaimStatus.SUBMITTED,
        memberId: 'member-10',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({ claims: [], total: 0, page: 1, totalPages: 0 });
      expect(mockClaimRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          status: ClaimStatus.SUBMITTED,
          memberId: 'member-10',
          reviewedBy: IsNull(),
        },
        relations: ['member'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('filters for SUPER_ADMIN role by reviewed but unfinalized claims', async () => {
      mockClaimRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.getAllClaims({
        reviewerRole: UserRole.SUPER_ADMIN,
        page: 2,
        limit: 15,
      });

      expect(mockClaimRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          reviewedBy: Not(IsNull()),
          checkerApprovedBy: IsNull(),
        },
        relations: ['member'],
        order: { createdAt: 'DESC' },
        skip: 15,
        take: 15,
      });
    });
  });

  describe('updateClaimStatus role guards & status branches', () => {
    it('throws BadRequestException when a non-admin role attempts to approve', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce({
        id: 'claim-1',
        status: ClaimStatus.UNDER_REVIEW,
      });

      await expect(
        service.updateClaimStatus('claim-1', ClaimStatus.APPROVED, 'agent-1', UserRole.AGENT),
      ).rejects.toThrow('Only Admin or Super Admin can approve');
    });

    it('throws BadRequestException when invalid transition attempted', async () => {
      mockClaimRepository.findOne.mockResolvedValueOnce({
        id: 'claim-1',
        status: ClaimStatus.SUBMITTED,
      });

      await expect(
        service.updateClaimStatus(
          'claim-1',
          ClaimStatus.PAYMENT_PROCESSED,
          'sa-1',
          UserRole.SUPER_ADMIN,
        ),
      ).rejects.toThrow('Cannot transition from submitted to payment_processed');
    });

    it('handles REJECTED status with reason and reviewer stamping', async () => {
      const claim = {
        id: 'claim-1',
        status: ClaimStatus.UNDER_REVIEW,
        memberId: 'member-1',
      };
      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimRepository.save.mockImplementation((c) => Promise.resolve(c));

      const updated = await service.updateClaimStatus(
        'claim-1',
        ClaimStatus.REJECTED,
        'admin-1',
        UserRole.ADMIN,
        { rejectionReason: 'Hospital bill not authentic' },
      );

      expect(updated.status).toBe(ClaimStatus.REJECTED);
      expect(updated.rejectionReason).toBe('Hospital bill not authentic');
      expect(updated.reviewedBy).toBe('admin-1');
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('handles DOCUMENT_REQUIRED status update', async () => {
      const claim = {
        id: 'claim-1',
        status: ClaimStatus.UNDER_REVIEW,
        memberId: 'member-1',
      };
      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimRepository.save.mockImplementation((c) => Promise.resolve(c));

      const updated = await service.updateClaimStatus(
        'claim-1',
        ClaimStatus.DOCUMENT_REQUIRED,
        'admin-1',
        UserRole.ADMIN,
      );

      expect(updated.status).toBe(ClaimStatus.DOCUMENT_REQUIRED);
      expect(updated.reviewedBy).toBe('admin-1');
    });

    it('handles HOSPITAL_VERIFICATION status update', async () => {
      const claim = {
        id: 'claim-1',
        status: ClaimStatus.UNDER_REVIEW,
        memberId: 'member-1',
      };
      mockClaimRepository.findOne.mockResolvedValueOnce(claim);
      mockClaimRepository.save.mockImplementation((c) => Promise.resolve(c));

      const updated = await service.updateClaimStatus(
        'claim-1',
        ClaimStatus.HOSPITAL_VERIFICATION,
        'admin-1',
        UserRole.ADMIN,
      );

      expect(updated.status).toBe(ClaimStatus.HOSPITAL_VERIFICATION);
    });
  });
});
