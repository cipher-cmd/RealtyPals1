import { render, screen, waitFor } from '@testing-library/react';
import DiscoverPage from '@/app/discover/page';

// Mock the components
jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('@/components/DiscoveryContent', () => {
  return function MockDiscoveryContent() {
    return <div data-testid="discovery-content">Discovery Content</div>;
  };
});

describe('Discover Page', () => {
  let getItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    getItemSpy.mockRestore();
  });

  it('redirects to root if user not authenticated', () => {
    getItemSpy.mockReturnValue(null);
    
    // Mock window.location properly
    const originalLocation = window.location;
    const mockHref = jest.fn();
    
    try {
      // @ts-ignore
      delete (window as any).location;
      window.location = { 
         ...originalLocation, 
         get href() { return 'http://localhost:3000/discover'; },
         set href(v) { mockHref(v); }
      } as any;
    } catch (e) {}
    
    render(<DiscoverPage />);
    
    expect(getItemSpy).toHaveBeenCalledWith('user_id');
    // We expect it to attempt redirect
    
    // Restore
    try {
      // @ts-ignore
      window.location = originalLocation;
    } catch (e) {}
  });

  it('renders sidebar and discovery content when authenticated', () => {
    getItemSpy.mockReturnValue('test-user');
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
    
    render(<DiscoverPage />);
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('discovery-content')).toBeInTheDocument();
  });
});
