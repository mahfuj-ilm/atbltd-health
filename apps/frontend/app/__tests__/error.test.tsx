import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../error';
import { logger } from '../lib/logger';

jest.mock('../lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ErrorBoundary', () => {
  const mockReset = jest.fn();
  const testError = Object.assign(new Error('Network failure'), { digest: 'err-123' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user-facing error message and retry button', () => {
    render(<ErrorBoundary error={testError} reset={mockReset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected error occurred\. Our team has been notified\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('logs the unhandled error with digest and stack', () => {
    render(<ErrorBoundary error={testError} reset={mockReset} />);

    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled client error captured by error boundary',
      expect.objectContaining({
        message: 'Network failure',
        digest: 'err-123',
      }),
    );
  });

  it('invokes reset handler when retry button is clicked', () => {
    render(<ErrorBoundary error={testError} reset={mockReset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
