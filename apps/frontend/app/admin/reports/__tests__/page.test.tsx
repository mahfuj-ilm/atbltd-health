import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsPage from '../page';

const mockUseAuth = jest.fn();

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Admin ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();
  });

  it('renders all reports including audit log for super_admin and downloads a report', async () => {
    mockUseAuth.mockReturnValue({
      token: 'admin-token',
      user: { role: 'super_admin' },
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['pdf-content'], { type: 'application/pdf' }),
    } as any);

    render(<ReportsPage />);

    expect(screen.getByRole('heading', { level: 1, name: /reports/i })).toBeInTheDocument();
    expect(screen.getByText('Member Report')).toBeInTheDocument();
    expect(screen.getByText('Payment Collection')).toBeInTheDocument();
    expect(screen.getByText('Benefit Applications')).toBeInTheDocument();
    expect(screen.getByText('Agent Performance')).toBeInTheDocument();
    expect(screen.getByText('Audit Log Report')).toBeInTheDocument();

    const downloadButtons = screen.getAllByRole('button');
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reports/members'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer admin-token' },
        })
      );
    });
  });

  it('hides Audit Log Report for regular admin role', () => {
    mockUseAuth.mockReturnValue({
      token: 'admin-token',
      user: { role: 'admin' },
    });

    render(<ReportsPage />);

    expect(screen.getByText('Member Report')).toBeInTheDocument();
    expect(screen.queryByText('Audit Log Report')).not.toBeInTheDocument();
  });

  it('handles download failure gracefully', async () => {
    mockUseAuth.mockReturnValue({
      token: 'admin-token',
      user: { role: 'admin' },
    });

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
    } as any);

    render(<ReportsPage />);

    const downloadButtons = screen.getAllByRole('button');
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
