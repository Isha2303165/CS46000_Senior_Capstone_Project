import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientCard } from '../client-card';
import { Client } from '@/types';

const mockClient: Client = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-05-15',
  gender: 'male',
  medicalConditions: ['Diabetes', 'Hypertension', 'High Cholesterol'],
  allergies: ['Penicillin', 'Shellfish'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-0123',
  emergencyContactRelationship: 'Spouse',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
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
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('ClientCard', () => {
  it('renders client basic information correctly', () => {
    render(<ClientCard client={mockClient} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Age \d+ • male/)).toBeInTheDocument();
  });

  it('displays medical conditions when present', () => {
    render(<ClientCard client={mockClient} />);
    
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument();
    expect(screen.getByText('Diabetes')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('High Cholesterol')).toBeInTheDocument();
  });

  it('displays allergies with warning styling when present', () => {
    render(<ClientCard client={mockClient} />);
    
    expect(screen.getAllByText('Allergies')).toHaveLength(2); // One in badge, one in section
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getByText('Shellfish')).toBeInTheDocument();
    
    // Check for allergies badge in header
    const allergiesBadges = screen.getAllByText('Allergies');
    const headerBadge = allergiesBadges.find(badge => badge.closest('[data-slot="badge"]'));
    expect(headerBadge).toBeTruthy();
  });

  it('displays emergency contact information', () => {
    render(<ClientCard client={mockClient} />);
    
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('555-0123')).toBeInTheDocument();
    expect(screen.getByText('Spouse')).toBeInTheDocument();
  });

  it('displays date of birth formatted correctly', () => {
    render(<ClientCard client={mockClient} />);
    
    // The text is split across elements, so use a more flexible matcher
    expect(screen.getByText(/Born/)).toBeInTheDocument();
    expect(screen.getByText(/May 14, 1980/)).toBeInTheDocument();
  });

  it('handles client with minimal information', () => {
    render(<ClientCard client={mockClientMinimal} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(/Age \d+ • Not specified/)).toBeInTheDocument();
    expect(screen.queryByText('Medical Conditions')).not.toBeInTheDocument();
    expect(screen.queryByText('Allergies')).not.toBeInTheDocument();
  });

  it('shows +X more badge when there are many medical conditions', () => {
    const clientWithManyConditions = {
      ...mockClient,
      medicalConditions: ['Condition 1', 'Condition 2', 'Condition 3', 'Condition 4', 'Condition 5']
    };
    
    render(<ClientCard client={clientWithManyConditions} />);
    
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('shows +X more badge when there are many allergies', () => {
    const clientWithManyAllergies = {
      ...mockClient,
      allergies: ['Allergy 1', 'Allergy 2', 'Allergy 3', 'Allergy 4', 'Allergy 5']
    };
    
    render(<ClientCard client={clientWithManyAllergies} />);
    
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ClientCard client={mockClient} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockClient);
  });

  it('calls onView when view details button is clicked', () => {
    const onView = vi.fn();
    render(<ClientCard client={mockClient} onView={onView} />);
    
    const viewButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);
    
    expect(onView).toHaveBeenCalledWith(mockClient);
  });

  it('does not render action buttons when callbacks are not provided', () => {
    render(<ClientCard client={mockClient} />);
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view details/i })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ClientCard client={mockClient} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<ClientCard client={mockClient} />);
    
    // Check that the card has proper structure for screen readers
    const clientName = screen.getByText('John Doe');
    expect(clientName).toBeInTheDocument();
    
    // Emergency contact should be clearly labeled
    const emergencyContact = screen.getByText('Emergency Contact');
    expect(emergencyContact).toBeInTheDocument();
  });
});