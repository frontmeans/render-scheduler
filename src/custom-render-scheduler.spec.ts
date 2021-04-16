import { customRenderScheduler } from './custom-render-scheduler';
import { RenderQueue } from './render-queue';
import type { RenderScheduleOptions } from './render-schedule';
import type { RenderExecution } from './render-shot';
import Mock = jest.Mock;

describe('CustomRenderScheduler', () => {
  it('passes config to enqueued render shots', () => {

    let exec = (): void => {/* not scheduled */};
    const scheduled: Mock<void, [RenderExecution]>[] = [];
    const executed: Mock<void, [RenderExecution]>[] = [];
    const queue: RenderQueue = {
      add: shot => scheduled.push(jest.fn(shot)),
      post: shot => scheduled.unshift(jest.fn(shot)),
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
  it('executes recurrent shots', () => {

    const schedule = jest.fn((task: () => void) => task());
    const recur = jest.fn((task: () => void) => task());

    const queue = RenderQueue.by({
      schedule,
      recur,
    });

    const scheduler = customRenderScheduler({
      newQueue: () => queue,
    });

    const result: number[] = [];

    const schedule1 = scheduler();
    const schedule2 = scheduler();

    schedule1(exec => {
      exec.postpone(() => {
        result.push(-11);
      });
      result.push(11);
      schedule2(exec => {
        exec.postpone(() => {
          result.push(-21);
        });
        result.push(21);
      });
      result.push(12);
    });

    expect(result).toEqual([11, 12, 21, -21, -11]);
  });
});
