import {
  getCommissions,
  approveCommission,
  confirmCommissionPayment,
  declineCommission,
  getClaims,
  getClaimDocuments,
  updateClaimStatus,
  getStaffUsers,
  resetStaffPassword,
  updateStaffStatus,
  updateStaffSettings,
} from '../apiClient';

describe('apiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getCommissions', () => {
    it('fetches commissions with query parameters', async () => {
      const mockResponse = {
        commissions: [{ id: 'comm-1', commissionAmount: 500, status: 'pending' }],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const res = await getCommissions('token-123', { page: 2, limit: 10, status: 'pending' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/commissions?page=2&limit=10&status=pending'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        }),
      );
      expect(res).toEqual(mockResponse);
    });

    it('throws error when server returns non-ok response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue({ message: 'Forbidden access' }),
      });

      await expect(getCommissions('token-123')).rejects.toThrow('Forbidden access');
    });
  });

  describe('approveCommission', () => {
    it('sends POST request to approve commission', async () => {
      const mockResult = { message: 'Commission approved' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await approveCommission('token-123', 'comm-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/commissions/comm-1/approve'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(res).toEqual(mockResult);
    });
  });

  describe('confirmCommissionPayment', () => {
    it('sends POST request to confirm commission payment', async () => {
      const mockResult = { message: 'Payment confirmed' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await confirmCommissionPayment('token-123', 'comm-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/commissions/comm-1/confirm-payment'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(res).toEqual(mockResult);
    });
  });

  describe('declineCommission', () => {
    it('sends POST request to decline commission with reason', async () => {
      const mockResult = { message: 'Commission declined' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await declineCommission('token-123', 'comm-1', 'Invalid document');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/commissions/comm-1/decline'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reason: 'Invalid document' }),
        }),
      );
      expect(res).toEqual(mockResult);
    });
  });

  describe('Claims endpoints', () => {
    it('fetches claims list', async () => {
      const mockClaims = { claims: [{ id: 'claim-1' }], total: 1 };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockClaims),
      });

      const res = await getClaims('token-123', { status: 'submitted' });
      expect(res).toEqual(mockClaims);
    });

    it('fetches claim documents', async () => {
      const mockDocs = [{ id: 'doc-1', fileName: 'test.pdf' }];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockDocs),
      });

      const res = await getClaimDocuments('token-123', 'claim-1');
      expect(res).toEqual(mockDocs);
    });

    it('updates claim status', async () => {
      const mockClaim = { id: 'claim-1', status: 'approved' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockClaim),
      });

      const res = await updateClaimStatus('token-123', 'claim-1', 'approved', {
        approvedAmount: 5000,
        notes: 'Verified hospital bill',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/claims/claim-1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            status: 'approved',
            approvedAmount: 5000,
            notes: 'Verified hospital bill',
          }),
        }),
      );
      expect(res).toEqual(mockClaim);
    });
  });

  describe('Staff Management API methods', () => {
    it('fetches staff users with query params', async () => {
      const mockStaffResponse = {
        users: [{ id: 'u1', memberId: 'ATB-26-SA-1', role: 'super_admin' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockStaffResponse),
      });

      const res = await getStaffUsers('token-123', {
        page: 1,
        limit: 20,
        role: 'admin',
        search: 'Admin',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/staff?page=1&limit=20&role=admin&search=Admin'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        }),
      );
      expect(res).toEqual(mockStaffResponse);
    });

    it('resets staff password', async () => {
      const mockResult = { message: 'Staff password reset successfully', memberId: 'ATB-26-AD-1' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await resetStaffPassword('token-123', 'staff-1', 'newSecret123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/staff/staff-1/password'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ newPassword: 'newSecret123' }),
        }),
      );
      expect(res).toEqual(mockResult);
    });

    it('updates staff active status', async () => {
      const mockResult = {
        message: 'Staff user deactivated successfully',
        user: { id: 'staff-1', isActive: false },
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await updateStaffStatus('token-123', 'staff-1', false);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/staff/staff-1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ isActive: false }),
        }),
      );
      expect(res).toEqual(mockResult);
    });

    it('updates staff settings', async () => {
      const mockResult = {
        message: 'Staff settings updated successfully',
        user: { id: 'staff-1', fullName: 'Updated Name', isTwoFactorEnabled: true },
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await updateStaffSettings('token-123', 'staff-1', {
        fullName: 'Updated Name',
        isTwoFactorEnabled: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/staff/staff-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            fullName: 'Updated Name',
            isTwoFactorEnabled: true,
          }),
        }),
      );
      expect(res).toEqual(mockResult);
    });
  });
});

