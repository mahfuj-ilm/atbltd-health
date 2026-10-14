import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';
import { authApi } from '../api';

jest.mock('../api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('throws an error if useAuth is called outside AuthProvider', () => {
    // Suppress React error boundary log in test output
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  it('initializes with default unauthenticated state when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRestored).toBe(true);
  });

  it('restores authenticated state from localStorage', () => {
    const mockUser = {
      memberId: 'MEM-001',
      fullName: 'John Doe',
      role: 'member',
      isActive: true,
    };
    localStorage.setItem('atb_token', 'test-token');
    localStorage.setItem('atb_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.token).toBe('test-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isRestored).toBe(true);
  });

  it('clears invalid JSON from localStorage on mount', () => {
    localStorage.setItem('atb_token', 'test-token');
    localStorage.setItem('atb_user', 'invalid-json{{{');

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('atb_token')).toBeNull();
    expect(localStorage.getItem('atb_user')).toBeNull();
  });

  it('handles successful staff login', async () => {
    const mockApiResponse = {
      accessToken: 'jwt-staff-token',
      user: {
        memberId: 'STAFF-1',
        fullName: 'Admin User',
        role: 'admin',
        isActive: true,
      },
    };
    (authApi.login as jest.Mock).mockResolvedValueOnce(mockApiResponse);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login('STAFF-1', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('jwt-staff-token');
    expect(result.current.user?.memberId).toBe('STAFF-1');
    expect(localStorage.getItem('atb_token')).toBe('jwt-staff-token');
  });

  it('handles failed staff login', async () => {
    (authApi.login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await expect(
      act(async () => {
        await result.current.login('STAFF-1', 'wrong');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles successful memberLogin', async () => {
    const mockUser = {
      memberId: 'MEM-999',
      fullName: 'Member Name',
      role: 'member',
      isActive: true,
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'member-jwt-token', user: mockUser }),
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.memberLogin('MEM-999');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('member-jwt-token');
    expect(result.current.user?.memberId).toBe('MEM-999');
    expect(localStorage.getItem('atb_token')).toBe('member-jwt-token');
  });

  it('handles failed memberLogin', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Member not found' }),
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await expect(
      act(async () => {
        await result.current.memberLogin('INVALID-ID');
      })
    ).rejects.toThrow('Member not found');

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears state and localStorage on logout', async () => {
    const mockUser = {
      memberId: 'MEM-001',
      fullName: 'John Doe',
      role: 'member',
      isActive: true,
    };
    localStorage.setItem('atb_token', 'test-token');
    localStorage.setItem('atb_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('atb_token')).toBeNull();
    expect(localStorage.getItem('atb_user')).toBeNull();
  });
});
