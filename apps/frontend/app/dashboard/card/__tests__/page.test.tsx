import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DigitalCardPage from '../page';
import { membershipApi } from '../../../lib/api';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}));

jest.mock('../../../lib/api', () => ({
  membershipApi: {
    getDashboard: jest.fn(),
  },
}));

describe('DigitalCardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders digital membership card and copies membership ID to clipboard', async () => {
    const writeTextMock = jest.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    (membershipApi.getDashboard as jest.Mock).mockResolvedValueOnce({
      digitalCard: {
        fullName: 'Kamal Hossain',
        memberId: 'MEM-2026-001',
        validUntil: '2027-01-01T00:00:00.000Z',
        isActive: true,
      },
    });

    render(<DigitalCardPage />);

    await waitFor(() => {
      expect(screen.getByText('Digital Membership Card')).toBeInTheDocument();
      expect(screen.getByText('Kamal Hossain')).toBeInTheDocument();
      expect(screen.getByText('MEM-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button');
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith('MEM-2026-001');
  });

  it('renders pending status and fallback date when inactive', async () => {
    (membershipApi.getDashboard as jest.Mock).mockResolvedValueOnce({
      digitalCard: {
        fullName: 'Pending Member',
        memberId: 'MEM-PENDING',
        validUntil: null,
        isActive: false,
      },
    });

    render(<DigitalCardPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending Member')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});
