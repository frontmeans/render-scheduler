import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import { RenderScheduleOptions } from './render-schedule';
import { RenderExecution } from './render-shot';
import Mock = jest.Mock;

describe('ScheduledRenderQueue', () => {

  let queue: RenderQueue;
  let mockSchedule: Mock;

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

describe('CustomRenderScheduler', () => {
  it('passes config to enqueued render shots', () => {

    let exec = (): void => {/* not scheduled */};
    const scheduled: Mock<void, [RenderExecution]>[] = [];
    const executed: Mock<void, [RenderExecution]>[] = [];
    const queue: RenderQueue = {
      add: shot => scheduled.push(jest.fn(shot)),
      pull: () => {

        const shot = scheduled.shift();

        if (shot) {
          executed.push(shot);
        }

        return shot;
      },
      schedule: task => exec = task,
      reset: () => queue,
    };
    const scheduler = customRenderScheduler({ newQueue: () => queue });
    const options: RenderScheduleOptions = { node: document.createElement('dev') };
    const schedule = scheduler(options);

    schedule(jest.fn());
    exec();

    expect(executed[0]).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining(options),
    }));
  });

});
