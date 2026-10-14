import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../page';

// Mock child components that make network calls or have heavy dependencies
jest.mock('../components/Navbar', () => {
  return function MockNavbar({ onJoin, onLanguageChange, language }: any) {
    return (
      <nav data-testid="mock-navbar">
        <button onClick={onJoin}>Join Now</button>
        <button onClick={onLanguageChange}>Switch to {language === 'bn' ? 'English' : 'Bangla'}</button>
      </nav>
    );
  };
});

jest.mock('../components/MembershipModal', () => {
  return function MockMembershipModal({ isOpen, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-membership-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

describe('Home Page (Landing)', () => {
  it('renders landing page with default Bengali language and switches language', () => {
    render(<Home />);

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('bn');

    const switchBtn = screen.getByText('Switch to English');
    fireEvent.click(switchBtn);

    expect(document.documentElement.lang).toBe('en');
    expect(document.body.style.fontFamily).toContain('Arial');
  });

  it('opens and closes the membership modal', () => {
    render(<Home />);

    expect(screen.queryByTestId('mock-membership-modal')).not.toBeInTheDocument();

    const joinBtn = screen.getByText('Join Now');
    fireEvent.click(joinBtn);

    expect(screen.getByTestId('mock-membership-modal')).toBeInTheDocument();

    const closeBtn = screen.getByText('Close Modal');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('mock-membership-modal')).not.toBeInTheDocument();
  });
});
