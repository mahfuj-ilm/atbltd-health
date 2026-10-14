import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '../page';
import { membershipApi } from '../../../lib/api';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}));

jest.mock('../../../lib/api', () => ({
  membershipApi: {
    getDashboard: jest.fn(),
  },
}));

describe('Dashboard ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner initially and then displays profile information', async () => {
    (membershipApi.getDashboard as jest.Mock).mockResolvedValueOnce({
      profile: {
        fullName: 'Afsana Mimi',
        mobileNumber: '01811223344',
        email: 'afsana@example.com',
        permanentAddress: 'Dhaka, Bangladesh',
        isKycVerified: true,
        createdAt: '2025-05-10T00:00:00.000Z',
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /my profile/i })).toBeInTheDocument();
      expect(screen.getByText('Afsana Mimi')).toBeInTheDocument();
      expect(screen.getByText('01811223344')).toBeInTheDocument();
      expect(screen.getByText('afsana@example.com')).toBeInTheDocument();
      expect(screen.getByText('Dhaka, Bangladesh')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  it('renders fallback values when optional profile fields are missing', async () => {
    (membershipApi.getDashboard as jest.Mock).mockResolvedValueOnce({
      profile: {
        fullName: 'Test User',
        mobileNumber: '01700000000',
        email: null,
        permanentAddress: null,
        isKycVerified: false,
        createdAt: null,
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getAllByText('Not provided').length).toBe(2);
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});
