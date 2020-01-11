/**
 * @module render-scheduler
 */
import { RenderScheduleConfig, RenderScheduler, ScheduledRender, ScheduledRenderExecution } from './render-scheduler';

export function customRenderScheduler(
    schedule: (this: void, task: (this: void) => void, config: RenderScheduleConfig) => void,
): RenderScheduler {

  let nextQueue: ScheduledRender[] = [];

  return config => {

    const { window } = config;
    let queued: [readonly ScheduledRender[], ScheduledRender] | [] = [];
    let scheduleQueue: () => void = doScheduleQueue;

    return render => {

      const queueStarted = !nextQueue.length;
      const [queue] = queued;

      if (queue === nextQueue) {
        queued[1] = render;
      } else {

        const newQueued = queued = [nextQueue, render];

        nextQueue.push((execution: ScheduledRenderExecution) => newQueued[1](execution));
      }

      if (queueStarted) {
        scheduleQueue();
      }
    };

    function doScheduleQueue() {
      scheduleQueue = () => {};
      for (;;) {

        const lastQueue = nextQueue;

        schedule(executeRenders, config);
        if (nextQueue === lastQueue || !nextQueue.length) {
          break;
        }
      }
      scheduleQueue = doScheduleQueue;
    }

    function executeRenders() {

      const queue = nextQueue;
      const execution: ScheduledRenderExecution = {
        window,
        postpone(postponed) {
          queue.push(postponed);
        },
      };

      nextQueue = [];
      for (; ;) {

        const render = queue.shift();

        if (!render) {
          break;
        }
        try {
          render(execution);
        } catch (e) {
          window.console.error(e);
        }
      }
    }
  };
}
