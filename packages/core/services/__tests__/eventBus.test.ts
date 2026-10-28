import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../eventBus';

describe('EventBus', () => {
  beforeEach(() => eventBus.clear());

  it('emits payload to registered subscribers', () => {
    const callback = vi.fn();
    eventBus.on('test:event', callback);
    eventBus.emit('test:event', { foo: 'bar' });
    expect(callback).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('supports multiple subscribers', () => {
    const first = vi.fn();
    const second = vi.fn();
    eventBus.on('multi', first);
    eventBus.on('multi', second);
    eventBus.emit('multi', 1);
    expect(first).toHaveBeenCalledWith(1);
    expect(second).toHaveBeenCalledWith(1);
  });

  it('does not throw when there are no subscribers', () => {
    expect(() => eventBus.emit('nobody:listens', null)).not.toThrow();
  });

  it('removes a subscriber with off', () => {
    const callback = vi.fn();
    eventBus.on('remove-me', callback);
    eventBus.off('remove-me', callback);
    eventBus.emit('remove-me', true);
    expect(callback).not.toHaveBeenCalled();
  });
});
