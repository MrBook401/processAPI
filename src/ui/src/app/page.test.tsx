import { render, screen } from '@testing-library/react';
import ProcessManagerDashboard from './page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock the api client so we don't make real requests
jest.mock('../lib/api/client', () => ({
  fetchEvents: jest.fn().mockResolvedValue([]),
  fetchApplications: jest.fn().mockResolvedValue([]),
  createEvent: jest.fn(),
  attachRelease: jest.fn(),
  validateRelease: jest.fn(),
  createApplication: jest.fn(),
}));

describe('ProcessManagerDashboard', () => {
  it('renders the dashboard with correct title', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProcessManagerDashboard />
      </QueryClientProvider>
    );

    expect(screen.getByText('Release Planner Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Applications')).toBeInTheDocument();
  });
});
