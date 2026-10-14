import { render, screen, fireEvent } from '@testing-library/react';
import AgentDashboardCards from '../AgentDashboardCards';
import KpiCards from '../KpiCards';
import PendingPaymentsTable from '../PendingPaymentsTable';
import ChartsSection from '../ChartsSection';

jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => null,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => null,
  };
});

describe('Admin Components', () => {
  describe('AgentDashboardCards', () => {
    it('renders agent stats correctly with commissions', () => {
      const stats = {
        members: { total: 120, active: 95 },
        commissions: { totalEarned: 45000, totalPaid: 30000 },
        agents: { total: 8 },
      };

      render(<AgentDashboardCards stats={stats} />);

      expect(screen.getByText('My Members')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('95 active')).toBeInTheDocument();
      expect(screen.getByText('Commission Earned')).toBeInTheDocument();
      expect(screen.getByText('45,000 BDT')).toBeInTheDocument();
      expect(screen.getByText('30,000 BDT paid')).toBeInTheDocument();
      expect(screen.getByText('Sub-Agents')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('handles missing commissions data gracefully', () => {
      const stats = {
        members: { total: 10, active: 5 },
        agents: { total: 1 },
      };

      render(<AgentDashboardCards stats={stats} />);

      expect(screen.getByText('0 BDT')).toBeInTheDocument();
      expect(screen.getByText('0 BDT paid')).toBeInTheDocument();
    });
  });

  describe('KpiCards', () => {
    it('renders all admin KPI cards with formatted values and changes', () => {
      const stats = {
        members: { total: 1500, active: 1200, inactive: 300, newThisMonth: 85 },
        payments: { totalCollection: 750000, pendingVerification: 12, verifiedToday: 8 },
        claims: { submitted: 45, pending: 10, approved: 30, rejected: 5 },
        agents: { total: 25, active: 18 },
      };

      render(<KpiCards stats={stats} />);

      expect(screen.getByText('Total Members')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('+85 this month')).toBeInTheDocument();

      expect(screen.getByText('Total Collection')).toBeInTheDocument();
      expect(screen.getByText('750,000 BDT')).toBeInTheDocument();
      expect(screen.getByText('12 pending verification')).toBeInTheDocument();

      expect(screen.getByText('Claims Submitted')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('30 approved · 5 rejected')).toBeInTheDocument();

      expect(screen.getByText('Active Agents')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('of 25 total')).toBeInTheDocument();
    });
  });

  describe('PendingPaymentsTable', () => {
    it('renders empty state when no payments are pending', () => {
      const onAuthorize = jest.fn();
      render(<PendingPaymentsTable payments={[]} onAuthorize={onAuthorize} />);

      expect(screen.getByText('Pending Authorizations')).toBeInTheDocument();
      expect(screen.getByText('All caught up')).toBeInTheDocument();
      expect(screen.getByText('No pending payments to authorize')).toBeInTheDocument();
    });

    it('renders payment list and calls onAuthorize when clicked', () => {
      const onAuthorize = jest.fn();
      const payments = [
        {
          id: 'pay-1',
          amount: 12000,
          method: 'bkash',
          senderAccount: '01700000000',
          status: 'pending',
          createdAt: '2026-03-15T10:00:00.000Z',
          user: {
            memberId: 'MEM-001',
            fullName: 'Karim Ullah',
            mobileNumber: '01711223344',
          },
        },
        {
          id: 'pay-2',
          amount: 6000,
          method: 'nagad',
          senderAccount: '',
          status: 'pending',
          createdAt: '2026-03-16T11:00:00.000Z',
        },
      ];

      render(<PendingPaymentsTable payments={payments} onAuthorize={onAuthorize} />);

      expect(screen.getByText('Karim Ullah')).toBeInTheDocument();
      expect(screen.getByText('MEM-001')).toBeInTheDocument();
      expect(screen.getByText('12,000 BDT')).toBeInTheDocument();
      expect(screen.getByText('01700000000')).toBeInTheDocument();

      // Second payment with fallback user and senderAccount
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();

      const authorizeButtons = screen.getAllByRole('button', { name: /authorize/i });
      expect(authorizeButtons).toHaveLength(2);

      fireEvent.click(authorizeButtons[0]);
      expect(onAuthorize).toHaveBeenCalledWith('pay-1');
    });
  });

  describe('ChartsSection', () => {
    it('renders all chart headings and legends', () => {
      render(<ChartsSection />);

      expect(screen.getByText('Revenue vs Claims')).toBeInTheDocument();
      expect(screen.getByText('Monthly comparison')).toBeInTheDocument();
      expect(screen.getByText('Application Status')).toBeInTheDocument();
      expect(screen.getByText('Member Growth')).toBeInTheDocument();
      expect(screen.getByText('Cumulative members over time')).toBeInTheDocument();

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
