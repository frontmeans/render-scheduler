import { ScheduledRenderQueue } from './custom-render-scheduler';
import Mock = jest.Mock;

describe('ScheduledRenderQueue', () => {

  let queue: ScheduledRenderQueue;
  let mockSchedule: Mock;

  beforeEach(() => {
    mockSchedule = jest.fn();
    queue = ScheduledRenderQueue.by({ schedule: mockSchedule });
  });

  describe('add', () => {
    it('enqueues render', () => {

      const render1 = jest.fn();
      const render2 = jest.fn();

      queue.add(render1);
      queue.add(render2);
      expect(queue.isEmpty).toBe(false);

      expect(queue.pull()).toBe(render1);
      expect(queue.isEmpty).toBe(false);

      expect(queue.pull()).toBe(render2);
      expect(queue.isEmpty).toBe(true);

      expect(queue.pull()).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('constructs another queue', () => {
      queue.add(jest.fn());

      const reset = queue.reset();

      expect(reset).not.toBe(queue);
      expect(reset.isEmpty).toBe(true);
    });
    it('does not replace itself by default', () => {
      queue.reset();
      expect(mockSchedule).not.toHaveBeenCalled();
    });
  });
});
