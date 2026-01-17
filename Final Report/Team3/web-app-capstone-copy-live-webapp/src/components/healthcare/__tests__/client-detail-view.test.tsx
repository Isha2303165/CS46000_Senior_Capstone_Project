import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientDetailView } from '../client-detail-view';
import type { Client } from '@/types';

const mockClientComplete: Client = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-05-15',
  gender: 'male',
  medicalRecordNumber: 'MRN123456',
  medicalConditions: ['Diabetes Type 2', 'Hypertension', 'High Cholesterol'],
  allergies: ['Penicillin', 'Shellfish', 'Latex'],
  currentMedications: ['Metformin 500mg', 'Lisinopril 10mg', 'Atorvastatin 20mg'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0123',
  emergencyContactRelationship: 'Spouse',
  insuranceProvider: 'Blue Cross Blue Shield',
  insurancePolicyNumber: 'BC123456789',
  insuranceGroupNumber: 'GRP001',
  primaryPhysician: 'Dr. Sarah Smith, MD',
  preferredPharmacy: 'CVS Pharmacy - Main Street',
  careNotes: 'Client prefers morning appointments. Has mobility issues - wheelchair accessible entrance required.',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-15T14:30:00Z'
};

const mockClientMinimal: Client = {
  id: '2',
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: '1990-03-20',
  emergencyContactName: 'John Smith',
  emergencyContactPhone: '555-0456',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z'
};

describe('ClientDetailView', () => {
  it('renders client header information correctly', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Age \d+ • Male/)).toBeInTheDocument();
    expect(screen.getByText('MRN: MRN123456')).toBeInTheDocument();
  });

  it('displays critical allergies alert prominently', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Critical Allergies')).toBeInTheDocument();
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getByText('Shellfish')).toBeInTheDocument();
    expect(screen.getByText('Latex')).toBeInTheDocument();
    
    // Check that the alert has proper styling (red background)
    const alertCard = screen.getByText('Critical Allergies').closest('[class*="border-red"]');
    expect(alertCard).toBeInTheDocument();
  });

  it('displays basic information section', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('May 14, 1980')).toBeInTheDocument();
    expect(screen.getByText(/\d+ years old/)).toBeInTheDocument();
    expect(screen.getByText(/Male/)).toBeInTheDocument();
    expect(screen.getByText('MRN123456')).toBeInTheDocument();
  });

  it('displays emergency contact information', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('555-0123')).toBeInTheDocument();
    expect(screen.getByText('Spouse')).toBeInTheDocument();
    
    // Check that phone number is a clickable link
    const phoneLink = screen.getByRole('link', { name: '555-0123' });
    expect(phoneLink).toHaveAttribute('href', 'tel:555-0123');
  });

  it('displays medical conditions section', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument();
    expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('High Cholesterol')).toBeInTheDocument();
  });

  it('displays current medications section', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Current Medications')).toBeInTheDocument();
    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
    expect(screen.getByText('Atorvastatin 20mg')).toBeInTheDocument();
  });

  it('displays insurance information section', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Insurance Information')).toBeInTheDocument();
    expect(screen.getByText('Blue Cross Blue Shield')).toBeInTheDocument();
    expect(screen.getByText('BC123456789')).toBeInTheDocument();
    expect(screen.getByText('GRP001')).toBeInTheDocument();
  });

  it('displays healthcare providers section', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Healthcare Providers')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Smith, MD')).toBeInTheDocument();
    expect(screen.getByText('CVS Pharmacy - Main Street')).toBeInTheDocument();
  });

  it('displays care notes section', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Care Notes')).toBeInTheDocument();
    expect(screen.getByText(/Client prefers morning appointments/)).toBeInTheDocument();
    expect(screen.getByText(/wheelchair accessible entrance required/)).toBeInTheDocument();
  });

  it('displays record information metadata', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.getByText('Record Information')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
    expect(screen.getByText(/Jan 01, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('handles client with minimal information', () => {
    render(<ClientDetailView client={mockClientMinimal} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(/Age \d+ • Not specified/)).toBeInTheDocument();
    expect(screen.queryByText('MRN:')).not.toBeInTheDocument();
    expect(screen.queryByText('Critical Allergies')).not.toBeInTheDocument();
    expect(screen.queryByText('Medical Conditions')).not.toBeInTheDocument();
    expect(screen.queryByText('Current Medications')).not.toBeInTheDocument();
    expect(screen.queryByText('Insurance Information')).not.toBeInTheDocument();
    expect(screen.queryByText('Healthcare Providers')).not.toBeInTheDocument();
    expect(screen.queryByText('Care Notes')).not.toBeInTheDocument();
  });

  it('shows edit button when onEdit callback is provided', () => {
    const onEdit = vi.fn();
    render(<ClientDetailView client={mockClientComplete} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit client/i });
    expect(editButton).toBeInTheDocument();
    
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockClientComplete);
  });

  it('does not show edit button when onEdit callback is not provided', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    expect(screen.queryByRole('button', { name: /edit client/i })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ClientDetailView client={mockClientComplete} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles different gender values correctly', () => {
    const clientFemale = { ...mockClientComplete, gender: 'female' as const };
    const { rerender } = render(<ClientDetailView client={clientFemale} />);
    expect(screen.getByText(/Age \d+ • Female/)).toBeInTheDocument();

    const clientOther = { ...mockClientComplete, gender: 'other' as const };
    rerender(<ClientDetailView client={clientOther} />);
    expect(screen.getByText(/Age \d+ • Other/)).toBeInTheDocument();

    const clientPreferNot = { ...mockClientComplete, gender: 'prefer_not_to_say' as const };
    rerender(<ClientDetailView client={clientPreferNot} />);
    expect(screen.getByText(/Prefer not_to_say/)).toBeInTheDocument();
  });

  it('calculates age correctly', () => {
    // Create a client with a known birth date
    const clientWithKnownAge = {
      ...mockClientComplete,
      dateOfBirth: '2000-01-01' // This should make them around 24 years old
    };
    
    render(<ClientDetailView client={clientWithKnownAge} />);
    
    // Check that age is calculated and displayed
    expect(screen.getByText(/Age \d+/)).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
    
    // Check for proper section headings
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    
    // Check that critical allergies section has proper alert styling
    const criticalAllergies = screen.getByText('Critical Allergies');
    expect(criticalAllergies).toBeInTheDocument();
  });

  it('displays all sections when client has complete information', () => {
    render(<ClientDetailView client={mockClientComplete} />);
    
    const expectedSections = [
      'Basic Information',
      'Emergency Contact',
      'Medical Conditions',
      'Current Medications',
      'Insurance Information',
      'Healthcare Providers',
      'Care Notes',
      'Record Information'
    ];
    
    expectedSections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });
});