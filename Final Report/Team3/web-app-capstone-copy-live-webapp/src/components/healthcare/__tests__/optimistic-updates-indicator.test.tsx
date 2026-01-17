import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  OptimisticUpdatesIndicator, 
  CompactOptimisticIndicator, 
  OptimisticUpdateToast 
} from '../optimistic-updates-indicator';
import { useOptimisticUpdates } from '@/hooks/use-real-time-sync';

// Mock the hook
vi.mock('@/hooks/use-real-time-sync', () => ({
  useOptimisticUpdates: vi.fn(),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'HH:mm:ss') return '10:30:45';
    if (formatStr === 'HH:mm') return '10:30';
    return '2023-01-01 10:30:45';
  }),
}));

describe('OptimisticUpdatesIndicator', () => {
  const mockRollbackUpdate = vi.fn();
  const mockRollbackAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when there are no updates', () => {
    (useOptimisticUpdates as any).mockReturnValue({
      updates: [],
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    const { container } = render(<OptimisticUpdatesIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render compact indicator when showDetails is false', () => {
    const mockUpdates = [
      {
        id: 'update-1',
        entity: 'medication',
        operation: 'update',
        data: { name: 'Test Med' },
        timestamp: '2023-01-01T10:30:45Z',
      },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdatesIndicator showDetails={false} />);

    expect(screen.getByText('1 pending')).toBeInTheDocument();
    expect(screen.queryByText('Pending Changes')).not.toBeInTheDocument();
  });

  it('should render detailed view when showDetails is true', () => {
    const mockUpdates = [
      {
        id: 'medication-1',
        entity: 'medication',
        operation: 'update',
        data: { name: 'Test Medication' },
        timestamp: '2023-01-01T10:30:45Z',
      },
      {
        id: 'appointment-1',
        entity: 'appointment',
        operation: 'create',
        data: { title: 'Test Appointment' },
        timestamp: '2023-01-01T10:31:00Z',
      },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdatesIndicator showDetails={true} />);

    expect(screen.getByText('Pending Changes (2)')).toBeInTheDocument();
    expect(screen.getByText('Undo All')).toBeInTheDocument();
    expect(screen.getByText('Updating Medication')).toBeInTheDocument();
    expect(screen.getByText('Creating Appointment')).toBeInTheDocument();
  });

  it('should call rollbackAll when Undo All button is clicked', () => {
    const mockUpdates = [
      {
        id: 'update-1',
        entity: 'medication',
        operation: 'update',
        data: { name: 'Test' },
        timestamp: '2023-01-01T10:30:45Z',
      },
      {
        id: 'update-2',
        entity: 'appointment',
        operation: 'create',
        data: { title: 'Test' },
        timestamp: '2023-01-01T10:31:00Z',
      },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdatesIndicator showDetails={true} />);

    fireEvent.click(screen.getByText('Undo All'));
    expect(mockRollbackAll).toHaveBeenCalled();
  });

  it('should call rollbackUpdate when individual undo button is clicked', () => {
    const mockUpdates = [
      {
        id: 'medication-1',
        entity: 'medication',
        operation: 'update',
        data: { name: 'Test Medication' },
        timestamp: '2023-01-01T10:30:45Z',
      },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdatesIndicator showDetails={true} />);

    const undoButtons = screen.getAllByTitle('Undo this change');
    fireEvent.click(undoButtons[0]);
    expect(mockRollbackUpdate).toHaveBeenCalledWith('medication-1');
  });

  it('should display correct operation icons and text', () => {
    const mockUpdates = [
      {
        id: 'create-1',
        entity: 'medication',
        operation: 'create',
        data: { name: 'New Med' },
        timestamp: '2023-01-01T10:30:45Z',
      },
      {
        id: 'update-1',
        entity: 'appointment',
        operation: 'update',
        data: { title: 'Updated Apt' },
        timestamp: '2023-01-01T10:31:00Z',
      },
      {
        id: 'delete-1',
        entity: 'message',
        operation: 'delete',
        data: { content: 'Deleted msg' },
        timestamp: '2023-01-01T10:32:00Z',
      },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdatesIndicator showDetails={true} />);

    expect(screen.getByText('Creating Medication')).toBeInTheDocument();
    expect(screen.getByText('Updating Appointment')).toBeInTheDocument();
    expect(screen.getByText('Deleting Message')).toBeInTheDocument();
  });

  it('should display correct data previews for different entities', () => {
    const mockUpdates = [
      {
        id: 'medication-log-1',
        entity: 'medication-log',
        operation: 'create',
        data: { status: 'taken', takenAt: '2023-01-01T10:30:00Z' },
        timestamp: '2023-01-01T10:30:45Z',
      },
      {
        id: 'medication-1',
        entity: 'medication',
        operation: 'update',
        data: { name: 'Aspirin' },
        timestamp: '2023-01-01T10:31:00Z',
      },
      {
        id: 'message-1',
        entity: 'message',
        operation: 'create',
        data: { content: 'This is a test message that is quite long and should be truncated' },
        timestamp: '2023-01-01T10:32:00Z',
      },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: mockRollbackUpdate,
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdatesIndicator showDetails={true} />);

    expect(screen.getByText('taken - 10:30')).toBeInTheDocument();
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.getByText(/This is a test message that is quite long and should be truncated/)).toBeInTheDocument();
  });
});

describe('CompactOptimisticIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when there are no updates', () => {
    (useOptimisticUpdates as any).mockReturnValue({
      updates: [],
      rollbackUpdate: vi.fn(),
      rollbackAll: vi.fn(),
    });

    const { container } = render(<CompactOptimisticIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render compact indicator with update count', () => {
    const mockUpdates = [
      { id: '1', entity: 'medication', operation: 'update' },
      { id: '2', entity: 'appointment', operation: 'create' },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: vi.fn(),
    });

    render(<CompactOptimisticIndicator />);

    expect(screen.getByText('2 syncing')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

describe('OptimisticUpdateToast', () => {
  const mockRollbackAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when there are no updates', () => {
    (useOptimisticUpdates as any).mockReturnValue({
      updates: [],
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    const { container } = render(<OptimisticUpdateToast />);
    expect(container.firstChild).toBeNull();
  });

  it('should render toast with update count', () => {
    const mockUpdates = [
      { id: '1', entity: 'medication', operation: 'update' },
      { id: '2', entity: 'appointment', operation: 'create' },
      { id: '3', entity: 'message', operation: 'create' },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdateToast />);

    expect(screen.getByText('Syncing Changes')).toBeInTheDocument();
    expect(screen.getByText('3 updates in progress')).toBeInTheDocument();
    expect(screen.getByText('Undo All')).toBeInTheDocument();
  });

  it('should handle singular update count', () => {
    const mockUpdates = [
      { id: '1', entity: 'medication', operation: 'update' },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdateToast />);

    expect(screen.getByText('1 update in progress')).toBeInTheDocument();
  });

  it('should call rollbackAll when Undo All is clicked', () => {
    const mockUpdates = [
      { id: '1', entity: 'medication', operation: 'update' },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdateToast />);

    fireEvent.click(screen.getByText('Undo All'));
    expect(mockRollbackAll).toHaveBeenCalled();
  });

  it('should dismiss when close button is clicked', () => {
    const mockUpdates = [
      { id: '1', entity: 'medication', operation: 'update' },
    ];

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    render(<OptimisticUpdateToast />);

    expect(screen.getByText('Syncing Changes')).toBeInTheDocument();

    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Syncing Changes')).not.toBeInTheDocument();
  });

  it('should reset dismissed state when updates become empty', () => {
    const mockUpdates = [
      { id: '1', entity: 'medication', operation: 'update' },
    ];

    const { rerender } = render(<OptimisticUpdateToast />);

    // Mock with updates
    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    rerender(<OptimisticUpdateToast />);
    expect(screen.getByText('Syncing Changes')).toBeInTheDocument();

    // Dismiss
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Syncing Changes')).not.toBeInTheDocument();

    // Mock with no updates, then with updates again
    (useOptimisticUpdates as any).mockReturnValue({
      updates: [],
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    rerender(<OptimisticUpdateToast />);

    (useOptimisticUpdates as any).mockReturnValue({
      updates: mockUpdates,
      rollbackUpdate: vi.fn(),
      rollbackAll: mockRollbackAll,
    });

    rerender(<OptimisticUpdateToast />);

    // Should show again after being reset
    expect(screen.getByText('Syncing Changes')).toBeInTheDocument();
  });
});