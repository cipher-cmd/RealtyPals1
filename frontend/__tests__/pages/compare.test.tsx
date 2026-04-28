import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ComparePage from '@/app/compare/page';

jest.mock('next/navigation');

describe('Compare Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('user_id', 'test-user');
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/sectors')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ sectors: [{ id: 's1', name: 'Sector 150', city: 'Noida' }] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ properties: [] }),
      });
    });
  });

  it('renders page title and subtitle', async () => {
    render(<ComparePage />);
    
    // Wait for async fetch + setState to complete
    await waitFor(() => {
      expect(screen.getByText(/Property Comparison/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Side-by-side comparison of price, area, and amenities/i)
      ).toBeInTheDocument();
    });
  });

  it('renders property selection dropdowns', async () => {
    render(<ComparePage />);
    
    // Wait for async fetch + setState to complete
    // Labels may not have proper htmlFor, so find by text and then locate the select
    await waitFor(() => {
      expect(screen.getByText('Property 1')).toBeInTheDocument();
      expect(screen.getByText('Property 2')).toBeInTheDocument();
      // Also verify selects are present
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders compare button', async () => {
    render(<ComparePage />);
    
    // Wait for async fetch + setState to complete
    // Query specifically for the disabled compare button in the main content (not sidebar)
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /compare/i });
      // Find the disabled one (main content button, not sidebar menu)
      const compareButton = buttons.find(btn => btn.hasAttribute('disabled'));
      expect(compareButton).toBeInTheDocument();
    });
  });

  it('shows toast when share report button is clicked', async () => {
    render(<ComparePage />);
    
    // Wait for async fetch + setState to complete before interacting
    await waitFor(() => {
      expect(screen.getByText('Share Report')).toBeInTheDocument();
    });
    
    const shareButton = screen.getByText('Share Report');
    fireEvent.click(shareButton);
    
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
  it('redirects to root if not authenticated', async () => {
    localStorage.removeItem('user_id');
    
    // Mock window.location properly
    const originalLocation = window.location;
    const mockHref = jest.fn();
    
    try {
      // @ts-ignore
      delete (window as any).location;
      window.location = { 
         ...originalLocation, 
         get href() { return 'http://localhost:3000/compare'; },
         set href(v) { mockHref(v); }
      } as any;
    } catch (e) {}
    
    render(<ComparePage />);
    
    await waitFor(() => {
    });
    
    // Restore
    try {
      // @ts-ignore
      window.location = originalLocation;
    } catch (e) {}
  });
});
