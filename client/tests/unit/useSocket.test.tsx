import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { io } from 'socket.io-client';
import { useSocket } from '../../src/hooks/useSocket';

vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('Frontend (Vitest): useSocket hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('connects on mount and disconnects on unmount', () => {
    // GIVEN: A mocked socket instance
    // AND a valid userId is provided
    const mockDisconnect = vi.fn();

    const mockSocket = {
      id: 'socket123',
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: mockDisconnect,
    };

    vi.mocked(io).mockReturnValue(mockSocket as any);

    // WHEN: The useSocket hook is mounted with a userId
    const { unmount } = renderHook(() => useSocket('testUser123'));

    // THEN: The socket connection should be created
    expect(io).toHaveBeenCalled();

    // WHEN: The hook is unmounted
    unmount();

    // THEN: The socket should disconnect cleanly
    expect(mockDisconnect).toHaveBeenCalled();
  });
});