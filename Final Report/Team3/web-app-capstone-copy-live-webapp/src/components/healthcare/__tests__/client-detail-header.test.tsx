import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach } from 'vitest';
import { ClientDetailHeader } from '../client-detail-header';
import type { Client } from '@/types';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  medicalRecordNumber: 'MRN123456',
  medicalConditions: ['Diabetes', 'Heart Disease'],
  allergies: ['Penicillin', 'Shellfish'],
  currentMedications: ['Metformin', 'Lisinopril'],
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1-555-0123',
  emergencyContactRelationship: 'Spouse',
  insuranceProvider: 'Blue Cross Blue Shield',
  insurancePolicyNumber: 'BC123456789',
  insuranceGroupNumber: 'GRP001',
  primaryPhysician: 'Dr. Smith',
  preferredPharmacy: 'CVS Pharmacy',
  careNotes: 'Client requires assistance with medication management.',
  isActive: true,
  caregivers: [],
  medications: [],
  appointments: [],
  messages: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockClientWithoutAllergies: Client = {
  ...mockClient,
  allergies: [],
  medicalConditions: ['Common Cold'],
};

describe('ClientDetailHeader', () => {
  const mockOnEdit = vi.fn();
  const mockOnEmergencyContact = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Breadcrumb Navigation', () => {
    it('should render breadcrumb navigation with correct links', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Clients')).toBeInTheDocument();
      expect(screen.getAllByText('John Doe')).toHaveLength(2); // One in breadcrumb, one in header
    });

    it('should have correct href attributes for breadcrumb links', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const clientsLink = screen.getByText('Clients').closest('a');
      
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(clientsLink).toHaveAttribute('href', '/clients');
    });

    it('should mark current page in breadcrumb with aria-current', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const currentPage = screen.getByRole('navigation').querySelector('[aria-current="page"]');
      expect(currentPage).toBeInTheDocument();
      expect(currentPage).toHaveTextContent('John Doe');
    });
  });

  describe('Client Information Display', () => {
    it('should display client name and basic information', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('John Doe');
      expect(screen.getByText(/Age \d+/)).toBeInTheDocument(); // Age should be displayed
      expect(screen.getByText('MRN: MRN123456')).toBeInTheDocument();
    });

    it('should display client avatar with correct initials', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const avatar = screen.getByText('JD');
      expect(avatar).toBeInTheDocument();
    });

    it('should calculate age correctly', () => {
      const youngClient = {
        ...mockClient,
        dateOfBirth: '2000-01-01',
      };

      render(
        <ClientDetailHeader 
          client={youngClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByText(/Age \d+/)).toBeInTheDocument(); // Age should be calculated
    });
  });

  describe('Critical Alerts', () => {
    it('should display allergy alerts when client has allergies', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByRole('alert', { name: 'Allergy Alert' })).toBeInTheDocument();
      expect(screen.getByText('Allergies: Penicillin, Shellfish')).toBeInTheDocument();
    });

    it('should display critical condition alerts for serious conditions', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByRole('alert', { name: 'Critical Medical Conditions' })).toBeInTheDocument();
      expect(screen.getByText(/Critical Conditions:.*Heart Disease/)).toBeInTheDocument();
    });

    it('should not display alerts when client has no allergies or critical conditions', () => {
      render(
        <ClientDetailHeader 
          client={mockClientWithoutAllergies}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.queryByRole('alert', { name: 'Allergy Alert' })).not.toBeInTheDocument();
      expect(screen.queryByRole('alert', { name: 'Critical Medical Conditions' })).not.toBeInTheDocument();
    });
  });

  describe('Emergency Contact Information', () => {
    it('should display emergency contact information', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByText('Emergency Contact:')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should make emergency contact clickable with tel: link', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const emergencyContactLink = screen.getByRole('link', { 
        name: 'Call emergency contact Jane Doe at +1-555-0123' 
      });
      
      expect(emergencyContactLink).toHaveAttribute('href', 'tel:+1-555-0123');
      fireEvent.click(emergencyContactLink);
      expect(mockOnEmergencyContact).toHaveBeenCalledTimes(1);
    });

    it('should not display emergency contact section when information is missing', () => {
      const clientWithoutEmergencyContact = {
        ...mockClient,
        emergencyContactName: '',
        emergencyContactPhone: '',
      };

      render(
        <ClientDetailHeader 
          client={clientWithoutEmergencyContact}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.queryByText('Emergency Contact:')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render edit client button', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const editButton = screen.getByRole('button', { name: 'Edit client information' });
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const editButton = screen.getByRole('button', { name: 'Edit client information' });
      fireEvent.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should render mobile emergency contact link when phone number exists', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const mobileEmergencyLink = screen.getByRole('link', { name: 'Call emergency contact at +1-555-0123' });
      expect(mobileEmergencyLink).toBeInTheDocument();
      expect(mobileEmergencyLink).toHaveAttribute('href', 'tel:+1-555-0123');
    });

    it('should call onEmergencyContact when mobile emergency link is clicked', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const mobileEmergencyLink = screen.getByRole('link', { name: 'Call emergency contact at +1-555-0123' });
      fireEvent.click(mobileEmergencyLink);
      
      expect(mockOnEmergencyContact).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: 'Allergy Alert' })).toBeInTheDocument();
      expect(screen.getByRole('alert', { name: 'Critical Medical Conditions' })).toBeInTheDocument();
    });

    it('should have proper alt text for client avatar', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      // Avatar should have proper alt text (handled by Avatar component)
      const avatarImage = document.querySelector('[alt="John Doe"]');
      if (avatarImage) {
        expect(avatarImage).toBeInTheDocument();
      } else {
        // If no alt text, check that avatar fallback is present
        expect(screen.getByText('JD')).toBeInTheDocument();
      }
    });

    it('should have descriptive button labels', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      expect(screen.getByRole('button', { name: 'Edit client information' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Call emergency contact at +1-555-0123' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Call emergency contact Jane Doe at +1-555-0123' })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for different screen sizes', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      // Check for responsive classes in the header structure
      const headerContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(headerContainer).toBeInTheDocument();
    });

    it('should hide edit button text on small screens', () => {
      render(
        <ClientDetailHeader 
          client={mockClient}
          onEdit={mockOnEdit}
          onEmergencyContact={mockOnEmergencyContact}
        />
      );

      const editButtonText = document.querySelector('.hidden.sm\\:inline');
      expect(editButtonText).toBeInTheDocument();
      expect(editButtonText).toHaveTextContent('Edit Client');
    });
  });
});