import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CreateAdminModal from '../CreateAdminModal';
import { createAdmin, ApiError } from '../../../../lib/apiClient';

jest.mock('../../../../lib/apiClient', () => ({
  createAdmin: jest.fn(),
  getErrorMessage: (err: unknown) => {
    if (typeof err === 'object' && err !== null && 'message' in err) {
      const msg = (err as { message: unknown }).message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    return err instanceof Error ? err.message : 'Unknown error';
  },
}));

describe('CreateAdminModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockToken = 'mock-admin-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal inputs correctly', () => {
    render(
      <CreateAdminModal
        token={mockToken}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByText('Create New Admin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Operations Officer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 01712345678')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@atbltd.health (optional)')).toBeInTheDocument();
  });

  it('submits admin creation with custom password and calls onSuccess', async () => {
    const mockCreatedResponse = {
      message: 'Admin account created successfully.',
      temporaryPassword: null,
      user: {
        id: 'new-ad-1',
        memberId: 'ATB-26-AD-2',
        fullName: 'New Operations Admin',
        mobileNumber: '01711223344',
        email: 'newadmin@atbltd.health',
        role: 'admin',
        isActive: true,
      },
    };

    (createAdmin as jest.Mock).mockResolvedValueOnce(mockCreatedResponse);

    render(
      <CreateAdminModal
        token={mockToken}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('e.g. Operations Officer'), 'New Operations Admin');
    await userEvent.type(screen.getByPlaceholderText('e.g. 01712345678'), '01711223344');
    await userEvent.type(screen.getByPlaceholderText('admin@atbltd.health (optional)'), 'newadmin@atbltd.health');
    await userEvent.type(screen.getByPlaceholderText('Leave blank to auto-generate from name & phone'), 'AdminPass123!');
    await userEvent.type(screen.getByPlaceholderText('Official address or office location (optional)'), 'Dhaka');
    fireEvent.click(screen.getByRole('checkbox'));

    const submitBtn = screen.getByRole('button', { name: 'Create Admin' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createAdmin).toHaveBeenCalledWith(mockToken, {
        fullName: 'New Operations Admin',
        mobileNumber: '01711223344',
        email: 'newadmin@atbltd.health',
        password: 'AdminPass123!',
        permanentAddress: 'Dhaka',
        isTwoFactorEnabled: true,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedResponse);
  });

  it('displays API error when createAdmin rejects with an Error', async () => {
    (createAdmin as jest.Mock).mockRejectedValueOnce(
      new Error('A user with this mobile number already exists.'),
    );

    render(
      <CreateAdminModal
        token={mockToken}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('e.g. Operations Officer'), 'Duplicate Admin');
    await userEvent.type(screen.getByPlaceholderText('e.g. 01712345678'), '01700000001');

    fireEvent.click(screen.getByRole('button', { name: 'Create Admin' }));

    expect(
      await screen.findByText('A user with this mobile number already exists.'),
    ).toBeInTheDocument();
  });

  it('displays structured ApiError message properly', async () => {
    const structuredError: ApiError = {
      message: 'Password must contain at least 6 characters',
      statusCode: 400,
      error: 'Bad Request',
    };
    (createAdmin as jest.Mock).mockRejectedValueOnce(structuredError);

    render(
      <CreateAdminModal
        token={mockToken}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('e.g. Operations Officer'), 'Short Pass Admin');
    await userEvent.type(screen.getByPlaceholderText('e.g. 01712345678'), '01700000005');

    fireEvent.click(screen.getByRole('button', { name: 'Create Admin' }));

    expect(
      await screen.findByText('Password must contain at least 6 characters'),
    ).toBeInTheDocument();
  });

  it('closes modal on cancel button click', () => {
    render(
      <CreateAdminModal
        token={mockToken}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});

