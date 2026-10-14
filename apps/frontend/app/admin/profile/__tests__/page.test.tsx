import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../page';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({
    token: 'admin-token',
    user: { fullName: 'Admin User', role: 'admin' },
  }),
}));

describe('Admin ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form with user details', () => {
    render(<ProfilePage />);

    expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
  });

  it('submits form successfully and displays success message', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as any);

    render(<ProfilePage />);

    const phoneInput = screen.getByPlaceholderText('01XXXXXXXXX');
    fireEvent.change(phoneInput, { target: { value: '01711223344' } });

    const submitBtn = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('handles submission errors and displays error message', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to update profile' }),
    } as any);

    render(<ProfilePage />);

    const phoneInput = screen.getByPlaceholderText('01XXXXXXXXX');
    fireEvent.change(phoneInput, { target: { value: '01711223344' } });

    const submitBtn = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });
});
