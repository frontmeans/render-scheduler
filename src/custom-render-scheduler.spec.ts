import { customRenderScheduler, ScheduledRenderQueue } from './custom-render-scheduler';
import { RenderScheduleOptions } from './render-schedule';
import { ScheduledRenderExecution } from './scheduled-render';
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

      expect(queue.pull()).toBe(render1);
      expect(queue.pull()).toBe(render2);
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
  it('passes config to enqueued renders', () => {

    let exec = (): void => {/* not scheduled */};
    const scheduled: Mock<void, [ScheduledRenderExecution]>[] = [];
    const executed: Mock<void, [ScheduledRenderExecution]>[] = [];
    const queue: ScheduledRenderQueue = {
      add: render => scheduled.push(jest.fn(render)),
      pull: () => {

        const render = scheduled.shift();

        if (render) {
          executed.push(render);
        }

        return render;
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
