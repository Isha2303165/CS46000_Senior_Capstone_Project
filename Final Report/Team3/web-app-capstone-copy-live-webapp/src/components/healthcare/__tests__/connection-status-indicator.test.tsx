import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  ConnectionStatusIndicator, 
  CompactConnectionStatus, 
  DetailedConnectionStatus 
} from '../connection-status-indicator';
import { useConnectionStatus, useConnectionRecovery } from '@/hooks/use-real-time-sync';

// Mock the hooks
vi.mock('@/hooks/use-real-time-sync', () => ({
  useConnectionStatus: vi.fn(),
  useConnectionRecovery: vi.fn(),
}));

describe('ConnectionStatusIndicator', () => {
  const mockForceReconnect = vi.fn();
  const mockRefreshAllData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: false,
    });
  });

  it('should display connected status', () => {
    (useConnectionStatus as any).mockReturnValue('connected');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: true,
      isConnecting: false,
      hasError: false,
    });

    render(<ConnectionStatusIndicator />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('should display connecting status with spinner', () => {
    (useConnectionStatus as any).mockReturnValue('connecting');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: true,
      hasError: false,
    });

    render(<ConnectionStatusIndicator />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    // Check for spinner by looking for the Loader2 icon (which has animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display error status with retry buttons', () => {
    (useConnectionStatus as any).mockReturnValue('error');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: true,
    });

    render(<ConnectionStatusIndicator />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should display disconnected status with retry buttons', () => {
    (useConnectionStatus as any).mockReturnValue('disconnected');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: false,
    });

    render(<ConnectionStatusIndicator />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should call forceReconnect when retry button is clicked', () => {
    (useConnectionStatus as any).mockReturnValue('error');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: true,
    });

    render(<ConnectionStatusIndicator />);

    fireEvent.click(screen.getByText('Retry'));
    expect(mockForceReconnect).toHaveBeenCalled();
  });

  it('should call refreshAllData when refresh button is clicked', () => {
    (useConnectionStatus as any).mockReturnValue('error');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: true,
    });

    render(<ConnectionStatusIndicator />);

    fireEvent.click(screen.getByText('Refresh'));
    expect(mockRefreshAllData).toHaveBeenCalled();
  });

  it('should not show text when showText is false', () => {
    (useConnectionStatus as any).mockReturnValue('connected');

    render(<ConnectionStatusIndicator showText={false} />);

    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    // Should still show the icon
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should apply different sizes correctly', () => {
    (useConnectionStatus as any).mockReturnValue('connected');

    const { rerender } = render(<ConnectionStatusIndicator size="sm" />);
    let icon = document.querySelector('svg');
    expect(icon).toHaveClass('h-3', 'w-3');

    rerender(<ConnectionStatusIndicator size="lg" />);
    icon = document.querySelector('svg');
    expect(icon).toHaveClass('h-5', 'w-5');
  });
});

describe('CompactConnectionStatus', () => {
  beforeEach(() => {
    (useConnectionStatus as any).mockReturnValue('connected');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: vi.fn(),
      refreshAllData: vi.fn(),
      isOnline: true,
      isConnecting: false,
      hasError: false,
    });
  });

  it('should render without text', () => {
    render(<CompactConnectionStatus />);

    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

describe('DetailedConnectionStatus', () => {
  const mockForceReconnect = vi.fn();
  const mockRefreshAllData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: false,
    });
  });

  it('should display detailed connected message', () => {
    (useConnectionStatus as any).mockReturnValue('connected');

    render(<DetailedConnectionStatus />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/Real-time updates are active/)).toBeInTheDocument();
  });

  it('should display detailed connecting message', () => {
    (useConnectionStatus as any).mockReturnValue('connecting');

    render(<DetailedConnectionStatus />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByText(/Establishing connection/)).toBeInTheDocument();
  });

  it('should display detailed error message with action buttons', () => {
    (useConnectionStatus as any).mockReturnValue('error');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: true,
    });

    render(<DetailedConnectionStatus />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/Connection error/)).toBeInTheDocument();
    expect(screen.getByText('Reconnect')).toBeInTheDocument();
    expect(screen.getByText('Refresh Data')).toBeInTheDocument();
  });

  it('should display detailed disconnected message with action buttons', () => {
    (useConnectionStatus as any).mockReturnValue('disconnected');

    render(<DetailedConnectionStatus />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText(/Real-time updates are disabled/)).toBeInTheDocument();
    expect(screen.getByText('Reconnect')).toBeInTheDocument();
    expect(screen.getByText('Refresh Data')).toBeInTheDocument();
  });

  it('should call reconnect and refresh functions', () => {
    (useConnectionStatus as any).mockReturnValue('error');
    (useConnectionRecovery as any).mockReturnValue({
      forceReconnect: mockForceReconnect,
      refreshAllData: mockRefreshAllData,
      isOnline: false,
      isConnecting: false,
      hasError: true,
    });

    render(<DetailedConnectionStatus />);

    fireEvent.click(screen.getByText('Reconnect'));
    expect(mockForceReconnect).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Refresh Data'));
    expect(mockRefreshAllData).toHaveBeenCalled();
  });
});