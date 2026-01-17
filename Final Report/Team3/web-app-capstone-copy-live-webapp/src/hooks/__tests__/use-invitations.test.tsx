import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInvitations } from '../use-invitations';
import type { SendInvitationData, AcceptInvitationData } from '../use-invitations';

const mockClient = {
  models: {
    CaregiverInvitation: {
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
    },
    UserProfile: {
      list: vi.fn(),
    },
    Client: {
      get: vi.fn(),
    },
    ClientCaregiver: {
      create: vi.fn(),
    },
  },
};

// Mock the Amplify client
vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => mockClient),
}));

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

describe('useInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendInvitation', () => {
    it('should send invitation successfully', async () => {
      const mockInvitation = {
        id: 'inv-1',
        clientId: 'client-1',
        invitedBy: 'user-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
        status: 'pending',
        token: 'mock-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockClient = {
        id: 'client-1',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockClient.models.UserProfile.list.mockResolvedValue({
        data: [mockUser],
      });

      mockClient.models.Client.get.mockResolvedValue({
        data: mockClient,
      });

      mockClient.models.CaregiverInvitation.create.mockResolvedValue({
        data: mockInvitation,
      });

      const { result } = renderHook(() => useInvitations());

      const invitationData: SendInvitationData = {
        clientId: 'client-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
        permissions: ['view'],
        personalMessage: 'Please join our caregiver',
      };

      let invitationResult;
      await act(async () => {
        invitationResult = await result.current.sendInvitation(invitationData);
      });

      expect(invitationResult).toEqual(mockInvitation);
      expect(mockClient.models.CaregiverInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-1',
          invitedBy: 'user-1',
          invitedEmail: 'test@example.com',
          role: 'secondary',
          permissions: ['view'],
          personalMessage: 'Please join our caregiver',
        })
      );
    });

    it('should handle errors when sending invitation', async () => {
      mockClient.models.UserProfile.list.mockRejectedValue(new Error('User not found'));

      const { result } = renderHook(() => useInvitations());

      const invitationData: SendInvitationData = {
        clientId: 'client-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
      };

      let invitationResult;
      await act(async () => {
        invitationResult = await result.current.sendInvitation(invitationData);
      });

      expect(invitationResult).toBeNull();
      expect(result.current.error).toBe('User not found');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const mockInvitation = {
        id: 'inv-1',
        clientId: 'client-1',
        invitedBy: 'user-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
        status: 'pending',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        permissions: ['view'],
      };

      mockClient.models.CaregiverInvitation.list.mockResolvedValue({
        data: [mockInvitation],
      });

      mockClient.models.CaregiverInvitation.update.mockResolvedValue({
        data: { ...mockInvitation, status: 'accepted' },
      });

      mockClient.models.ClientCaregiver.create.mockResolvedValue({
        data: {
          id: 'pc-1',
          clientId: 'client-1',
          caregiverId: 'user-2',
          role: 'secondary',
        },
      });

      const { result } = renderHook(() => useInvitations());

      const acceptanceData: AcceptInvitationData = {
        token: 'valid-token',
        userId: 'user-2',
      };

      let acceptResult;
      await act(async () => {
        acceptResult = await result.current.acceptInvitation(acceptanceData);
      });

      expect(acceptResult).toBe(true);
      expect(mockClient.models.CaregiverInvitation.update).toHaveBeenCalledWith({
        id: 'inv-1',
        status: 'accepted',
        invitedUserId: 'user-2',
        acceptedAt: expect.any(String),
      });
      expect(mockClient.models.ClientCaregiver.create).toHaveBeenCalledWith({
        clientId: 'client-1',
        caregiverId: 'user-2',
        role: 'secondary',
        permissions: ['view'],
        addedBy: 'user-1',
        addedAt: expect.any(String),
      });
    });

    it('should reject expired invitation', async () => {
      const mockInvitation = {
        id: 'inv-1',
        clientId: 'client-1',
        invitedBy: 'user-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
        status: 'pending',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      };

      mockClient.models.CaregiverInvitation.list.mockResolvedValue({
        data: [mockInvitation],
      });

      const { result } = renderHook(() => useInvitations());

      const acceptanceData: AcceptInvitationData = {
        token: 'expired-token',
        userId: 'user-2',
      };

      let acceptResult;
      await act(async () => {
        acceptResult = await result.current.acceptInvitation(acceptanceData);
      });

      expect(acceptResult).toBe(false);
      expect(result.current.error).toBe('Invitation has expired');
    });

    it('should reject invalid token', async () => {
      mockClient.models.CaregiverInvitation.list.mockResolvedValue({
        data: [],
      });

      const { result } = renderHook(() => useInvitations());

      const acceptanceData: AcceptInvitationData = {
        token: 'invalid-token',
        userId: 'user-2',
      };

      let acceptResult;
      await act(async () => {
        acceptResult = await result.current.acceptInvitation(acceptanceData);
      });

      expect(acceptResult).toBe(false);
      expect(result.current.error).toBe('Invalid or expired invitation');
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation successfully', async () => {
      const mockInvitation = {
        id: 'inv-1',
        status: 'cancelled',
      };

      mockClient.models.CaregiverInvitation.update.mockResolvedValue({
        data: mockInvitation,
      });

      const { result } = renderHook(() => useInvitations());

      let cancelResult;
      await act(async () => {
        cancelResult = await result.current.cancelInvitation('inv-1');
      });

      expect(cancelResult).toBe(true);
      expect(mockClient.models.CaregiverInvitation.update).toHaveBeenCalledWith({
        id: 'inv-1',
        status: 'cancelled',
      });
    });
  });

  describe('validateInvitationToken', () => {
    it('should validate valid token', async () => {
      const mockInvitation = {
        id: 'inv-1',
        token: 'valid-token',
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockClient.models.CaregiverInvitation.list.mockResolvedValue({
        data: [mockInvitation],
      });

      const { result } = renderHook(() => useInvitations());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateInvitationToken('valid-token');
      });

      expect(validationResult).toEqual(mockInvitation);
    });

    it('should mark expired token as expired', async () => {
      const mockInvitation = {
        id: 'inv-1',
        token: 'expired-token',
        status: 'pending',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      mockClient.models.CaregiverInvitation.list.mockResolvedValue({
        data: [mockInvitation],
      });

      mockClient.models.CaregiverInvitation.update.mockResolvedValue({
        data: { ...mockInvitation, status: 'expired' },
      });

      const { result } = renderHook(() => useInvitations());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateInvitationToken('expired-token');
      });

      expect(validationResult).toBeNull();
      expect(mockClient.models.CaregiverInvitation.update).toHaveBeenCalledWith({
        id: 'inv-1',
        status: 'expired',
      });
    });

    it('should return null for invalid token', async () => {
      mockClient.models.CaregiverInvitation.list.mockResolvedValue({
        data: [],
      });

      const { result } = renderHook(() => useInvitations());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateInvitationToken('invalid-token');
      });

      expect(validationResult).toBeNull();
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation successfully', async () => {
      const mockInvitation = {
        id: 'inv-1',
        clientId: 'client-1',
        invitedEmail: 'test@example.com',
        role: 'secondary',
        status: 'pending',
        token: 'old-token',
        expiresAt: new Date().toISOString(),
      };

      mockClient.models.CaregiverInvitation.get.mockResolvedValue({
        data: mockInvitation,
      });

      mockClient.models.CaregiverInvitation.update.mockResolvedValue({
        data: {
          ...mockInvitation,
          token: 'new-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const { result } = renderHook(() => useInvitations());

      let resendResult;
      await act(async () => {
        resendResult = await result.current.resendInvitation('inv-1');
      });

      expect(resendResult).toBe(true);
      expect(mockClient.models.CaregiverInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'inv-1',
          status: 'pending',
          token: expect.any(String),
          expiresAt: expect.any(String),
        })
      );
    });
  });
});