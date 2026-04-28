import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiscoveryContent from '@/components/DiscoveryContent';
import { Property } from '@/types/property';

const mockProperties: Property[] = [];

describe('DiscoveryContent Component', () => {
  const mockOnLoadProperties = jest.fn();
  const mockOnUpdateProperties = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with correct title', () => {
    render(
      <DiscoveryContent
        properties={[]}
        loading={false}
        onLoadProperties={mockOnLoadProperties}
        onUpdateProperties={mockOnUpdateProperties}
        userId="test-user"
      />
    );
    
    expect(screen.getByText('Noida Property Validator')).toBeInTheDocument();
  });

  it('shows initial welcome message for chat-first experience', async () => {
    render(
      <DiscoveryContent
        properties={[]}
        loading={false}
        onLoadProperties={mockOnLoadProperties}
        onUpdateProperties={mockOnUpdateProperties}
        userId="test-user"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Hi! I'm your property advisor/i)
      ).toBeInTheDocument();
    });
  });

  it('renders chat input with qualification placeholder by default', () => {
    render(
      <DiscoveryContent
        properties={[]}
        loading={false}
        onLoadProperties={mockOnLoadProperties}
        onUpdateProperties={mockOnUpdateProperties}
        userId="test-user"
      />
    );

    const input = screen.getByPlaceholderText(
      /Ask about property prices, comparisons, or listings in Noida/i
    );
    expect(input).toBeInTheDocument();
  });

  it('shows toast when plus icon is clicked', () => {
    render(
      <DiscoveryContent
        properties={[]}
        loading={false}
        onLoadProperties={mockOnLoadProperties}
        onUpdateProperties={mockOnUpdateProperties}
        userId="test-user"
      />
    );
    
    const plusButton = screen.getByText('+').closest('button');
    if (plusButton) {
      fireEvent.click(plusButton);
      expect(screen.getByText('Coming soon')).toBeInTheDocument();
    }
  });

  it('shows toast when mic icon is clicked', () => {
    render(
      <DiscoveryContent
        properties={[]}
        loading={false}
        onLoadProperties={mockOnLoadProperties}
        onUpdateProperties={mockOnUpdateProperties}
        userId="test-user"
      />
    );
    
    const micButton = screen.getByLabelText('Voice input');
    fireEvent.click(micButton);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

});
