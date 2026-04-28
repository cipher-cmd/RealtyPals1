import { render, screen, waitFor } from '@testing-library/react';
import Toast from '@/components/Toast';

describe('Toast Component', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders message correctly', () => {
    const onClose = jest.fn();
    render(<Toast message="Test message" onClose={onClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose after default duration', async () => {
    const onClose = jest.fn();
    render(<Toast message="Test message" onClose={onClose} />);
    
    expect(onClose).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose after custom duration', async () => {
    const onClose = jest.fn();
    render(<Toast message="Test message" onClose={onClose} duration={5000} />);
    
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('appears at top center of screen', () => {
    const onClose = jest.fn();
    const { container } = render(<Toast message="Test message" onClose={onClose} />);
    
    const toast = container.firstChild as HTMLElement;
    // Component uses top-20 in Tailwind, assert position classes accordingly
    expect(toast).toHaveClass('fixed', 'top-20', 'left-1/2', '-translate-x-1/2');
  });
});
