import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import StaffSettingsPage from '../page';
import { useAuth } from '../../../lib/auth-context';
import {
  getStaffUsers,
  resetStaffPassword,
  updateStaffStatus,
  updateStaffSettings,
  createAdmin,
  StaffUser,
} from '../../../lib/apiClient';

jest.mock('../../../lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../lib/apiClient', () => {
  const actual = jest.requireActual('../../../lib/apiClient');
  return {
    ...actual,
    getStaffUsers: jest.fn(),
    resetStaffPassword: jest.fn(),
    updateStaffStatus: jest.fn(),
    updateStaffSettings: jest.fn(),
    createAdmin: jest.fn(),
  };
});

jest.mock('../../components/AdminTable', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
}));

const mockStaffList: StaffUser[] = [
  {
    id: 'sa-1',
    memberId: 'ATB-26-SA-1',
    fullName: 'Master Super Admin',
    mobileNumber: '01700000001',
    email: 'superadmin@example.com',
    role: 'super_admin',
    isActive: true,
    isKycVerified: true,
    isTwoFactorEnabled: true,
    lastLoginAt: '2026-10-15T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
  },
  {
    id: 'ad-2',
    memberId: 'ATB-26-AD-1',
    fullName: 'Operations Admin',
    mobileNumber: '01700000002',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    isKycVerified: true,
    isTwoFactorEnabled: false,
    lastLoginAt: '2026-10-14T00:00:00Z',
    createdAt: '2026-08-02T00:00:00Z',
    updatedAt: '2026-10-14T00:00:00Z',
  },
  {
    id: 'ag-3',
    memberId: 'ATB-26-AG-1',
    fullName: 'Field Agent',
    mobileNumber: '01700000003',
    email: null,
    role: 'agent',
    isActive: false,
    isKycVerified: false,
    isTwoFactorEnabled: false,
    lastLoginAt: null,
    createdAt: '2026-08-03T00:00:00Z',
    updatedAt: '2026-08-03T00:00:00Z',
  },
];

describe('StaffSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: 'mock-sa-token',
      user: {
        id: 'sa-1',
        fullName: 'Master Super Admin',
        role: 'super_admin',
      },
    });
  });

  it('renders access restricted when user is not super_admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      token: 'mock-admin-token',
      user: {
        id: 'ad-2',
        role: 'admin',
      },
    });

    render(<StaffSettingsPage />);
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(
      screen.getByText(/Staff settings, credentials, and account activation controls/i),
    ).toBeInTheDocument();
  });

  it('renders staff list and badges properly for super_admin', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValueOnce({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<StaffSettingsPage />);

    expect(await screen.findByText('Staff Accounts (3)')).toBeInTheDocument();
    expect(screen.getByText('Master Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Operations Admin')).toBeInTheDocument();
    expect(screen.getByText('Field Agent')).toBeInTheDocument();
    expect(screen.getByText('ATB-26-SA-1')).toBeInTheDocument();
    expect(screen.getByText('ATB-26-AD-1')).toBeInTheDocument();
    expect(screen.getByText('ATB-26-AG-1')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument(); // Badge for self
  });

  it('renders empty state when no staff members match', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValueOnce({
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<StaffSettingsPage />);

    expect(
      await screen.findByText('No staff members found matching criteria.'),
    ).toBeInTheDocument();
  });

  it('filters by role tabs when clicked', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: [mockStaffList[1]],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<StaffSettingsPage />);
    await waitFor(() => expect(getStaffUsers).toHaveBeenCalled());

    const adminsTab = screen.getByRole('button', { name: 'Admins' });
    fireEvent.click(adminsTab);

    await waitFor(() => {
      expect(getStaffUsers).toHaveBeenCalledWith(
        'mock-sa-token',
        expect.objectContaining({ role: 'admin' }),
      );
    });
  });

  it('updates search query and filters', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: [mockStaffList[0]],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<StaffSettingsPage />);
    await waitFor(() => expect(getStaffUsers).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    await userEvent.type(searchInput, 'Master');

    await waitFor(() => {
      expect(getStaffUsers).toHaveBeenCalledWith(
        'mock-sa-token',
        expect.objectContaining({ search: 'Master' }),
      );
    });
  });

  it('opens Reset Password modal and resets password successfully', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    (resetStaffPassword as jest.Mock).mockResolvedValueOnce({
      message: 'Staff password reset successfully',
      memberId: 'ATB-26-AD-1',
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Operations Admin')).toBeInTheDocument();

    const resetButtons = screen.getAllByTitle('Reset Password');
    fireEvent.click(resetButtons[1]); // Click for Operations Admin

    expect(screen.getByText('Reset Staff Password')).toBeInTheDocument();
    expect(screen.getAllByText(/Operations Admin/i).length).toBeGreaterThanOrEqual(1);

    const newPassInput = screen.getByPlaceholderText('Enter at least 6 characters');
    const confirmPassInput = screen.getByPlaceholderText('Re-type new password');

    // Mismatched passwords
    await userEvent.type(newPassInput, 'newPass123');
    await userEvent.type(confirmPassInput, 'wrongPass');
    fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();

    // Matched passwords
    await userEvent.clear(confirmPassInput);
    await userEvent.type(confirmPassInput, 'newPass123');
    fireEvent.click(screen.getByRole('button', { name: 'Set New Password' }));

    await waitFor(() => {
      expect(resetStaffPassword).toHaveBeenCalledWith('mock-sa-token', 'ad-2', 'newPass123');
    });

    expect(await screen.findByText(/Staff password reset successfully/i)).toBeInTheDocument();
  });

  it('opens Edit Staff Settings modal and updates settings successfully', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    (updateStaffSettings as jest.Mock).mockResolvedValueOnce({
      message: 'Staff settings updated successfully',
      user: { ...mockStaffList[1], fullName: 'Updated Admin Name' },
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Operations Admin')).toBeInTheDocument();

    const editButtons = screen.getAllByTitle('Edit Staff Settings');
    fireEvent.click(editButtons[1]); // Click for Operations Admin

    expect(screen.getByText('Edit Staff Settings')).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Operations Admin');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Admin Name');

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateStaffSettings).toHaveBeenCalledWith(
        'mock-sa-token',
        'ad-2',
        expect.objectContaining({ fullName: 'Updated Admin Name' }),
      );
    });

    expect(await screen.findByText(/Staff settings updated successfully/i)).toBeInTheDocument();
  });

  it('opens Status toggle modal and toggles activation', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    (updateStaffStatus as jest.Mock).mockResolvedValueOnce({
      message: 'Staff user deactivated successfully',
      user: { ...mockStaffList[1], isActive: false },
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Operations Admin')).toBeInTheDocument();

    const deactivateButton = screen.getByTitle('Deactivate Account');
    fireEvent.click(deactivateButton);

    expect(screen.getByText('Deactivate Staff Account')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to deactivate/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Deactivation' }));

    await waitFor(() => {
      expect(updateStaffStatus).toHaveBeenCalledWith('mock-sa-token', 'ad-2', false);
    });

    expect(await screen.findByText(/Staff user deactivated successfully/i)).toBeInTheDocument();
  });

  it('prevents deactivating self account', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Master Super Admin')).toBeInTheDocument();

    const selfButton = screen.getByTitle('Cannot deactivate your own account');
    expect(selfButton).toBeDisabled();
  });

  it('handles error when API fails', async () => {
    (getStaffUsers as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

    render(<StaffSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument();
    });
  });

  it('renders pagination controls and navigates pages', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 45,
      page: 1,
      limit: 20,
      totalPages: 3,
    });

    render(<StaffSettingsPage />);

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((b) => b.querySelector('svg.lucide-chevron-right'));
    if (nextButton) {
      fireEvent.click(nextButton);
      await waitFor(() => {
        expect(getStaffUsers).toHaveBeenCalledWith(
          'mock-sa-token',
          expect.objectContaining({ page: 2 }),
        );
      });
    }
  });

  it('opens Create Admin modal, validates inputs, and submits new admin successfully', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    (createAdmin as jest.Mock).mockResolvedValueOnce({
      message: 'Admin account created successfully.',
      user: {
        id: 'new-ad-1',
        memberId: 'ATB-26-AD-2',
        fullName: 'New Operations Admin',
        mobileNumber: '01711223344',
        email: 'newadmin@atbltd.health',
        role: 'admin',
        isActive: true,
        isKycVerified: true,
        isTwoFactorEnabled: true,
        lastLoginAt: null,
        createdAt: '2026-10-16T00:00:00Z',
        updatedAt: '2026-10-16T00:00:00Z',
      },
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Staff Accounts (3)')).toBeInTheDocument();

    const createBtn = screen.getByRole('button', { name: /Create Admin/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Create New Admin')).toBeInTheDocument();
    expect(screen.getByText(/Add an administrator with full operations/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('e.g. Operations Officer');
    const mobileInput = screen.getByPlaceholderText('e.g. 01712345678');
    const emailInput = screen.getByPlaceholderText('admin@atbltd.health (optional)');
    const passInput = screen.getByPlaceholderText('Leave blank to auto-generate from name & phone');
    const addressInput = screen.getByPlaceholderText('Official address or office location (optional)');
    const twoFactorCheckbox = screen.getByRole('checkbox');

    await userEvent.type(nameInput, 'New Operations Admin');
    await userEvent.type(mobileInput, '01711223344');
    await userEvent.type(emailInput, 'newadmin@atbltd.health');
    await userEvent.type(passInput, 'AdminPass123!');
    await userEvent.type(addressInput, 'Dhaka, Bangladesh');
    fireEvent.click(twoFactorCheckbox);

    // Submit form: find Create Admin button inside modal
    const submitBtn = screen.getAllByRole('button', { name: 'Create Admin' }).pop()!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createAdmin).toHaveBeenCalledWith('mock-sa-token', {
        fullName: 'New Operations Admin',
        mobileNumber: '01711223344',
        email: 'newadmin@atbltd.health',
        password: 'AdminPass123!',
        permanentAddress: 'Dhaka, Bangladesh',
        isTwoFactorEnabled: true,
      });
    });

    expect(
      await screen.findByText(/Admin account created successfully\. \(ID: ATB-26-AD-2\)\./i),
    ).toBeInTheDocument();
  });

  it('creates admin with auto-generated temporary password when password is left blank', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    (createAdmin as jest.Mock).mockResolvedValueOnce({
      message: 'Admin account created successfully.',
      temporaryPassword: 'New223344',
      user: {
        id: 'new-ad-2',
        memberId: 'ATB-26-AD-3',
        fullName: 'Auto Pass Admin',
        mobileNumber: '01799223344',
        role: 'admin',
        isActive: true,
      },
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Staff Accounts (3)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Create Admin/i }));

    await userEvent.type(screen.getByPlaceholderText('e.g. Operations Officer'), 'Auto Pass Admin');
    await userEvent.type(screen.getByPlaceholderText('e.g. 01712345678'), '01799223344');

    const submitBtn = screen.getAllByRole('button', { name: 'Create Admin' }).pop()!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createAdmin).toHaveBeenCalledWith('mock-sa-token', {
        fullName: 'Auto Pass Admin',
        mobileNumber: '01799223344',
        email: undefined,
        password: undefined,
        permanentAddress: undefined,
        isTwoFactorEnabled: false,
      });
    });

    expect(
      await screen.findByText(/Auto-generated temporary password: New223344/i),
    ).toBeInTheDocument();
  });

  it('displays error in modal if createAdmin API rejects', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    (createAdmin as jest.Mock).mockRejectedValueOnce(
      new Error('A user with this mobile number already exists.'),
    );

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Staff Accounts (3)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Create Admin/i }));

    await userEvent.type(screen.getByPlaceholderText('e.g. Operations Officer'), 'Duplicate Admin');
    await userEvent.type(screen.getByPlaceholderText('e.g. 01712345678'), '01700000001');

    const submitBtn = screen.getAllByRole('button', { name: 'Create Admin' }).pop()!;
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('A user with this mobile number already exists.'),
    ).toBeInTheDocument();
  });

  it('closes Create Admin modal on cancel click', async () => {
    (getStaffUsers as jest.Mock).mockResolvedValue({
      users: mockStaffList,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(<StaffSettingsPage />);
    expect(await screen.findByText('Staff Accounts (3)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Create Admin/i }));
    expect(screen.getByText('Create New Admin')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Create New Admin')).not.toBeInTheDocument();
  });
});

