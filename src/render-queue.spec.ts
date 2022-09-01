import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { RenderQueue } from './render-queue';

describe('RenderQueue', () => {
  let queue: RenderQueue;
  let mockSchedule: Mock<() => void>;

  beforeEach(() => {
    mockSchedule = jest.fn();
    queue = RenderQueue.by({ schedule: mockSchedule });
  });

  describe('add', () => {
    it('enqueues render shots', () => {
      const shot1 = jest.fn();
      const shot2 = jest.fn();

      queue.add(shot1);
      queue.add(shot2);

      expect(queue.pull()).toBe(shot1);
      expect(queue.pull()).toBe(shot2);
      expect(queue.pull()).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('constructs another queue', () => {
      queue.add(jest.fn());

      const reset = queue.reset();

      expect(reset).not.toBe(queue);
      expect(reset.pull()).toBeUndefined();
    });
    it('does not replace itself by default', () => {
      queue.reset();
      expect(mockSchedule).not.toHaveBeenCalled();
    });
  });
});
