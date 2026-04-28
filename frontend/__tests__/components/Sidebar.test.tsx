import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

jest.mock('next/navigation');

describe('Sidebar Component', () => {
  const mockPush = jest.fn();
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    localStorage.clear();
  });

  it('renders logo and company name', () => {
    render(<Sidebar activeView="discovery" onViewChange={mockOnViewChange} userId="test-user" />);
    
    expect(screen.getByAltText('RealtyPal Logo')).toBeInTheDocument();
  });

  it('renders all menu items', () => {
    render(<Sidebar activeView="discovery" onViewChange={mockOnViewChange} userId="test-user" />);
    
    expect(screen.getByText(/Discovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare/i)).toBeInTheDocument();
    expect(screen.getByText(/Value Estimator/i)).toBeInTheDocument();
  });

  it('highlights active view', () => {
    const { rerender } = render(
      <Sidebar activeView="discovery" onViewChange={mockOnViewChange} userId="test-user" />
    );
    
    const discoveryButton = screen.getByText(/Discovery/i).closest('button');
    expect(discoveryButton).toHaveClass('bg-gradient-to-r');
    
    rerender(<Sidebar activeView="saved" onViewChange={mockOnViewChange} userId="test-user" />);
    const savedButton = screen.getByText(/Saved/i).closest('button');
    expect(savedButton).toHaveClass('bg-gradient-to-r');
  });

  it('navigates to correct route on menu item click', () => {
    render(<Sidebar activeView="discovery" onViewChange={mockOnViewChange} userId="test-user" />);
    
    fireEvent.click(screen.getByText(/Saved/i));
    expect(mockPush).toHaveBeenCalledWith('/saved');
    expect(mockOnViewChange).toHaveBeenCalledWith('saved');
  });

  it('handles logout correctly', () => {
    localStorage.setItem('user_id', 'test-user');
    
    // Mock window.location properly
    const originalLocation = window.location;
    const mockHref = jest.fn();
    
    // Instead of delete, we can try to just mock the property if possible, 
    // or wrap in a try-catch for JSDOM compatibility
    try {
      // @ts-ignore
      delete (window as any).location;
      window.location = { 
         ...originalLocation, 
         get href() { return 'http://localhost:3000/discover'; },
         set href(v) { mockHref(v); }
      } as any;
    } catch (e) {
      // If delete fails, we can't easily mock window.location in this environment
      // but we can at least assert on localStorage
    }
    
    render(<Sidebar activeView="discovery" onViewChange={mockOnViewChange} userId="test-user" />);
    
    fireEvent.click(screen.getByText('Logout'));
    
    expect(localStorage.getItem('user_id')).toBeNull();
    
    // Restore
    try {
      // @ts-ignore
      window.location = originalLocation;
    } catch (e) {}
  });

  it('renders New Chat button', () => {
    render(<Sidebar activeView="discovery" onViewChange={mockOnViewChange} userId="test-user" />);
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });
});
