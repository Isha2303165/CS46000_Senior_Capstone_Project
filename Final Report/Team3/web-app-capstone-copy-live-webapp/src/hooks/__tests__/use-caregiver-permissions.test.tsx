import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCaregiverPermissions } from '../use-caregiver-permissions';
import { client } from '@/lib/graphql-client';

// Mock the GraphQL client
vi.mock('@/lib/graphql-client', () => ({
  client: {
    models: {
      Client: {
        get: vi.fn(),
      },
      ClientCaregiver: {
        list: vi.fn(),
      },
      UserProfile: {
        list: vi.fn(),
      },
    },
  },
}));

// Mock the auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('useCaregiverPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches permissions for primary caregiver', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });

    vi.mocked(client.models.Client.get).mockResolvedValue({
      data: { id: 'client-1', firstName: 'John', lastName: 'Doe' },
    });

    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-1', userId: 'user-1', email: 'test@example.com' }],
    });

    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{
        clientId: 'client-1',
        caregiverId: 'user-1',
        role: 'primary',
        permissions: ['view', 'edit', 'admin'],
        isActive: true,
      }],
    });

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe('primary');
    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.canManageMedications).toBe(true);
    expect(result.current.canManageAppointments).toBe(true);
    expect(result.current.canSendMessages).toBe(true);
    expect(result.current.canInviteCaregivers).toBe(true);
    expect(result.current.canAdminister).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches permissions for secondary caregiver', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-2', email: 'secondary@example.com' },
    });

    vi.mocked(client.models.Client.get).mockResolvedValue({
      data: { id: 'client-1', firstName: 'John', lastName: 'Doe' },
    });

    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-2', userId: 'user-2', email: 'secondary@example.com' }],
    });

    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{
        clientId: 'client-1',
        caregiverId: 'user-2',
        role: 'secondary',
        permissions: ['view', 'messages'],
        isActive: true,
      }],
    });

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe('secondary');
    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canManageMedications).toBe(false);
    expect(result.current.canManageAppointments).toBe(false);
    expect(result.current.canSendMessages).toBe(true);
    expect(result.current.canInviteCaregivers).toBe(false);
    expect(result.current.canAdminister).toBe(false);
  });

  it('fetches permissions for view-only caregiver', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-3', email: 'viewer@example.com' },
    });

    vi.mocked(client.models.Client.get).mockResolvedValue({
      data: { id: 'client-1', firstName: 'John', lastName: 'Doe' },
    });

    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-3', userId: 'user-3', email: 'viewer@example.com' }],
    });

    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{
        clientId: 'client-1',
        caregiverId: 'user-3',
        role: 'view_only',
        permissions: ['view'],
        isActive: true,
      }],
    });

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe('view_only');
    expect(result.current.canView).toBe(true);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canManageMedications).toBe(false);
    expect(result.current.canManageAppointments).toBe(false);
    expect(result.current.canSendMessages).toBe(false);
    expect(result.current.canInviteCaregivers).toBe(false);
    expect(result.current.canAdminister).toBe(false);
  });

  it('handles no caregiver relationship', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-4', email: 'unauthorized@example.com' },
    });

    vi.mocked(client.models.Client.get).mockResolvedValue({
      data: { id: 'client-1', firstName: 'John', lastName: 'Doe' },
    });

    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [],
    });

    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [],
    });

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBeNull();
    expect(result.current.canView).toBe(false);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.error).toBe('No caregiver relationship found');
  });

  it('handles missing user', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: null,
    });

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('User or client ID not available');
  });

  it('handles missing client ID', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });

    const { result } = renderHook(() => useCaregiverPermissions(''));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('User or client ID not available');
  });

  it('handles API errors gracefully', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });

    vi.mocked(client.models.Client.get).mockRejectedValue(
      new Error('Failed to fetch client')
    );

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch client');
  });

  it('uses user profile ID when available', async () => {
    const { useAuthStore } = require('@/lib/stores/auth-store');
    useAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });

    vi.mocked(client.models.Client.get).mockResolvedValue({
      data: { id: 'client-1', firstName: 'John', lastName: 'Doe' },
    });

    vi.mocked(client.models.UserProfile.list).mockResolvedValue({
      data: [{ id: 'profile-1', userId: 'user-1', email: 'test@example.com' }],
    });

    vi.mocked(client.models.ClientCaregiver.list).mockResolvedValue({
      data: [{
        clientId: 'client-1',
        caregiverId: 'profile-1', // Using profile ID instead of user ID
        role: 'primary',
        permissions: ['view', 'edit', 'admin'],
        isActive: true,
      }],
    });

    const { result } = renderHook(() => useCaregiverPermissions('client-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe('primary');
    expect(result.current.canAdminister).toBe(true);
  });
});