import { logger } from './logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

export interface CommissionItem {
  id: string;
  agentCode: string;
  memberCode: string;
  commissionType: string;
  registrationAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  agent?: { user?: { fullName: string } };
  member?: { fullName: string; memberId: string };
}

export interface CommissionsResponse {
  commissions: CommissionItem[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface ClaimItem {
  id: string;
  memberId?: string;
  surgeryType: string;
  hospitalName: string;
  admissionDate: string;
  operationDate?: string | null;
  doctorName?: string | null;
  claimedAmount: number;
  approvedAmount: number | null;
  status: string;
  rejectionReason: string | null;
  notes: string | null;
  documents?: string[] | null;
  createdAt: string;
  member?: { memberId: string; fullName: string; mobileNumber: string };
}

export interface ClaimsResponse {
  claims: ClaimItem[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface ClaimDocumentItem {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  notes: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface UpdateClaimStatusPayload {
  approvedAmount?: number | string;
  rejectionReason?: string;
  notes?: string;
}

/**
 * Standard typed request helper wrapping fetch with structured logging and error handling
 */
async function request<T>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  if (typeof response.json === 'function') {
    try {
      data = await response.json();
    } catch {
      data = typeof response.text === 'function' ? await response.text() : null;
    }
  } else if (typeof response.text === 'function') {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && 'message' in data
        ? (data as { message?: string }).message
        : null) || `Request failed with status ${response.status}`;
    logger.error('API client request failed', {
      endpoint,
      status: response.status,
      error: errorMsg,
    });
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * Commission API methods
 */
export async function getCommissions(
  token: string,
  params?: { page?: number; limit?: number; status?: string },
): Promise<CommissionsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return request<CommissionsResponse>(`/commissions${qs ? `?${qs}` : ''}`, token);
}

export async function approveCommission(
  token: string,
  id: string,
): Promise<{ message: string; commission?: CommissionItem }> {
  return request<{ message: string; commission?: CommissionItem }>(
    `/commissions/${id}/approve`,
    token,
    { method: 'POST' },
  );
}

export async function confirmCommissionPayment(
  token: string,
  id: string,
): Promise<{ message: string; commission?: CommissionItem }> {
  return request<{ message: string; commission?: CommissionItem }>(
    `/commissions/${id}/confirm-payment`,
    token,
    { method: 'POST' },
  );
}

export async function declineCommission(
  token: string,
  id: string,
  reason?: string,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/commissions/${id}/decline`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Claims API methods
 */
export async function getClaims(
  token: string,
  params?: { page?: number; limit?: number; status?: string },
): Promise<ClaimsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return request<ClaimsResponse>(`/claims${qs ? `?${qs}` : ''}`, token);
}

export async function getClaimDocuments(
  token: string,
  claimId: string,
): Promise<ClaimDocumentItem[]> {
  return request<ClaimDocumentItem[]>(`/claims/${claimId}/documents`, token);
}

export async function updateClaimStatus(
  token: string,
  claimId: string,
  status: string,
  payload?: UpdateClaimStatusPayload,
): Promise<ClaimItem> {
  return request<ClaimItem>(`/claims/${claimId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify({
      status,
      ...payload,
      approvedAmount: payload?.approvedAmount ? Number(payload.approvedAmount) : undefined,
    }),
  });
}

/**
 * Staff Management API types and methods (Super Admin only)
 */
export interface StaffUser {
  id: string;
  memberId: string;
  fullName: string;
  mobileNumber: string;
  email: string | null;
  role: 'super_admin' | 'admin' | 'owner' | 'agent';
  isActive: boolean;
  isKycVerified: boolean;
  isTwoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponse {
  users: StaffUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateStaffSettingsPayload {
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  role?: string;
  isTwoFactorEnabled?: boolean;
}

export async function getStaffUsers(
  token: string,
  params?: { page?: number; limit?: number; role?: string; search?: string },
): Promise<StaffListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.role) query.set('role', params.role);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return request<StaffListResponse>(`/admin/staff${qs ? `?${qs}` : ''}`, token);
}

export async function resetStaffPassword(
  token: string,
  userId: string,
  newPassword: string,
): Promise<{ message: string; memberId?: string }> {
  return request<{ message: string; memberId?: string }>(
    `/admin/staff/${userId}/password`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    },
  );
}

export async function updateStaffStatus(
  token: string,
  userId: string,
  isActive: boolean,
): Promise<{ message: string; user?: StaffUser }> {
  return request<{ message: string; user?: StaffUser }>(
    `/admin/staff/${userId}/status`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    },
  );
}

export async function updateStaffSettings(
  token: string,
  userId: string,
  payload: UpdateStaffSettingsPayload,
): Promise<{ message: string; user?: StaffUser }> {
  return request<{ message: string; user?: StaffUser }>(
    `/admin/staff/${userId}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

