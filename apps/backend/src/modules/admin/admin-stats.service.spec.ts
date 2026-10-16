import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminStatsService } from './admin-stats.service';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';

describe('AdminStatsService', () => {
  let service: AdminStatsService;

  const mockUserRepository = {
    count: jest.fn(),
  };

  const mockPaymentRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
    }),
  };

  const mockClaimRepository = {
    count: jest.fn(),
  };

  const mockAgentRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStatsService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
        { provide: getRepositoryToken(Claim), useValue: mockClaimRepository },
        { provide: getRepositoryToken(Agent), useValue: mockAgentRepository },
      ],
    }).compile();

    service = module.get<AdminStatsService>(AdminStatsService);
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should aggregate counts correctly', async () => {
      mockUserRepository.count.mockResolvedValue(10);
      mockPaymentRepository.count.mockResolvedValue(5);
      mockClaimRepository.count.mockResolvedValue(2);
      mockAgentRepository.count.mockResolvedValue(4);

      const stats = await service.getDashboardStats();

      expect(stats.members.total).toBe(10);
      expect(stats.payments.totalCollection).toBe(5000);
      expect(stats.agents.total).toBe(4);
    });

    it('should handle zero collection correctly', async () => {
      mockPaymentRepository.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      });

      const stats = await service.getDashboardStats();
      expect(stats.payments.totalCollection).toBe(0);
    });
  });

  describe('getAgentDashboardStats', () => {
    it('should return zero stats when agent not found', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.getAgentDashboardStats('user-uuid');

      expect(result.members.total).toBe(0);
      expect(result.commissions.totalEarned).toBe(0);
      expect(result.agents.total).toBe(0);
    });

    it('should return agent stats when agent found', async () => {
      mockAgentRepository.findOne.mockResolvedValueOnce({
        id: 'agent-uuid',
        agentCode: 'ATB-26-AG-1',
        totalCommissionEarned: 500,
        totalCommissionPaid: 200,
      });
      mockUserRepository.count.mockResolvedValueOnce(10);
      mockUserRepository.count.mockResolvedValueOnce(7);
      mockAgentRepository.count.mockResolvedValueOnce(3);

      const result = await service.getAgentDashboardStats('user-uuid');

      expect(result.members.total).toBe(10);
      expect(result.members.active).toBe(7);
      expect(result.commissions.totalEarned).toBe(500);
      expect(result.agents.total).toBe(3);
    });
  });
});
