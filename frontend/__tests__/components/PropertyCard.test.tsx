import { render, screen } from '@testing-library/react';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types/property';

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
}));

const mockProperty: Property = {
  id: '1',
  sector_id: 'sector-1',
  property_type: 'flat',
  bhk: 3,
  size_sqft: 1400,
  price: 7000000,
  price_per_sqft: 5000,
  builder: 'Godrej',
  floor: 6,
  status: 'ready',
  amenities: ['parking', 'security', 'lift'],
  sector: {
    id: 'sector-1',
    city: 'Noida',
    name: 'Sector 150',
    avg_price_low: 4500,
    avg_price_high: 6500,
    demand_level: 'medium',
    supply_level: 'medium',
    volatility_flag: false,
  },
  score: 10,
};

describe('PropertyCard Component', () => {
  it('renders property details correctly', () => {
    render(<PropertyCard property={mockProperty} />);
    
    // Check for BHK snippets (may appear in multiple places)
    const bhkSnippets = screen.getAllByText(/3 BHK/i);
    expect(bhkSnippets.length).toBeGreaterThan(0);
    expect(screen.getByText('₹0.70 Cr')).toBeInTheDocument();
    // Price per sqft is shown as "₹5,000/sqft" in a combined format
    expect(screen.getByText(/₹5,000/i)).toBeInTheDocument();
    expect(screen.getByText(/1,400 sqft/i)).toBeInTheDocument();
    // Builder appears as "Godrej • 3 BHK" - use flexible matcher
    expect(screen.getByText(/Godrej/i)).toBeInTheDocument();
    expect(screen.getByText(/Floor 6/i)).toBeInTheDocument();
  });

  it('displays ready status badge', () => {
    render(<PropertyCard property={mockProperty} />);
    // Status badge now shows "Ready" instead of "Ready to Move"
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('displays under construction status badge', () => {
    const underConstructionProperty = { ...mockProperty, status: 'under_construction' as const };
    render(<PropertyCard property={underConstructionProperty} />);
    expect(screen.getByText('Under Construction')).toBeInTheDocument();
  });

  it('displays amenities', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('parking')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
    expect(screen.getByText('lift')).toBeInTheDocument();
  });
});
