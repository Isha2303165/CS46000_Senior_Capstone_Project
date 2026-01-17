import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicationCard } from '../medication-card';
import { Medication } from '@/types';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'h:mm a') return '9:00 AM';
    if (formatStr === 'MMM dd, h:mm a') return 'Jan 15, 9:00 AM';
    return 'Jan 15, 2024';
  }),
  isAfter: vi.fn(() => false),
  isBefore: vi.fn(() => false),
  addHours: vi.fn(() => new Date())
}));

const mockMedication: Medication = {
  id: '1',
  clientId: 'client-1',
  name: 'Metformin',
  genericName: 'Metformin HCl',
  dosage: '500',
  unit: 'mg',
  frequency: 'Twice daily',
  route: 'oral',
  scheduleType: 'fixed_times',
  prescribingDoctor: 'Dr. Smith',
  instructions: 'Take with food',
  sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset'],
  startDate: '2024-01-01',
  isActive: true,
  isPRN: false,
  nextDueAt: '2024-01-15T09:00:00Z',
  lastTakenAt: '2024-01-14T09:00:00Z',
  missedDoses: 2,
  totalDoses: 30,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockPRNMedication: Medication = {
  ...mockMedication,
  id: '2',
  name: 'Ibuprofen',
  isPRN: true,
  nextDueAt: undefined,
  instructions: 'Take as needed for pain'
};

const mockInactiveMedication: Medication = {
  ...mockMedication,
  id: '3',
  name: 'Old Medication',
  isActive: false
};

describe('MedicationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders medication basic information correctly', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('(Metformin HCl)')).toBeInTheDocument();
    expect(screen.getByText('500 mg')).toBeInTheDocument();
  });

  it('displays dosage and frequency information', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.getByText('Frequency:')).toBeInTheDocument();
    expect(screen.getByText('Twice daily')).toBeInTheDocument();
    expect(screen.getByText('Route:')).toBeInTheDocument();
    expect(screen.getByText(/oral/i)).toBeInTheDocument();
  });

  it('displays prescribing doctor information', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.getByText('Prescribed by:')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('displays instructions when present', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.getByText('Instructions:')).toBeInTheDocument();
    expect(screen.getByText('Take with food')).toBeInTheDocument();
  });

  it('displays side effects when present', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.getByText('Possible side effects:')).toBeInTheDocument();
    expect(screen.getByText('Nausea')).toBeInTheDocument();
    expect(screen.getByText('Diarrhea')).toBeInTheDocument();
    expect(screen.getByText('Stomach upset')).toBeInTheDocument();
  });

  it('shows +X more badge when there are many side effects', () => {
    const medicationWithManySideEffects = {
      ...mockMedication,
      sideEffects: ['Effect 1', 'Effect 2', 'Effect 3', 'Effect 4', 'Effect 5']
    };
    
    render(<MedicationCard medication={medicationWithManySideEffects} />);
    
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('displays medication statistics', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.getByText('Total doses:')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Missed doses:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays PRN medication correctly', () => {
    render(<MedicationCard medication={mockPRNMedication} />);
    
    expect(screen.getByText('As Needed')).toBeInTheDocument();
    expect(screen.queryByText('Next due:')).not.toBeInTheDocument();
  });

  it('displays inactive medication correctly', () => {
    render(<MedicationCard medication={mockInactiveMedication} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls onTakeMedication when mark as taken button is clicked', () => {
    const onTakeMedication = vi.fn();
    render(<MedicationCard medication={mockMedication} onTakeMedication={onTakeMedication} />);
    
    const takeButton = screen.getByRole('button', { name: /mark as taken/i });
    fireEvent.click(takeButton);
    
    expect(onTakeMedication).toHaveBeenCalledWith(mockMedication);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<MedicationCard medication={mockMedication} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockMedication);
  });

  it('calls onView when view button is clicked', () => {
    const onView = vi.fn();
    render(<MedicationCard medication={mockMedication} onView={onView} />);
    
    const viewButton = screen.getByRole('button', { name: /view/i });
    fireEvent.click(viewButton);
    
    expect(onView).toHaveBeenCalledWith(mockMedication);
  });

  it('does not show take medication button for inactive medications', () => {
    const onTakeMedication = vi.fn();
    render(<MedicationCard medication={mockInactiveMedication} onTakeMedication={onTakeMedication} />);
    
    expect(screen.queryByRole('button', { name: /mark as taken/i })).not.toBeInTheDocument();
  });

  it('does not render action buttons when callbacks are not provided', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    expect(screen.queryByRole('button', { name: /mark as taken/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MedicationCard medication={mockMedication} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles medication without generic name', () => {
    const medicationWithoutGeneric = {
      ...mockMedication,
      genericName: undefined
    };
    
    render(<MedicationCard medication={medicationWithoutGeneric} />);
    
    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('handles medication without instructions', () => {
    const medicationWithoutInstructions = {
      ...mockMedication,
      instructions: undefined
    };
    
    render(<MedicationCard medication={medicationWithoutInstructions} />);
    
    expect(screen.queryByText('Instructions:')).not.toBeInTheDocument();
  });

  it('handles medication without side effects', () => {
    const medicationWithoutSideEffects = {
      ...mockMedication,
      sideEffects: undefined
    };
    
    render(<MedicationCard medication={medicationWithoutSideEffects} />);
    
    expect(screen.queryByText('Possible side effects:')).not.toBeInTheDocument();
  });

  it('displays missed doses in red when greater than 0', () => {
    render(<MedicationCard medication={mockMedication} />);
    
    const missedDosesValue = screen.getByText('2');
    expect(missedDosesValue).toHaveClass('text-red-600');
  });

  it('displays missed doses in green when 0', () => {
    const medicationWithNoMissedDoses = {
      ...mockMedication,
      missedDoses: 0
    };
    
    render(<MedicationCard medication={medicationWithNoMissedDoses} />);
    
    const missedDosesValue = screen.getByText('0');
    expect(missedDosesValue).toHaveClass('text-green-600');
  });
});