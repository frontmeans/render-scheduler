/**
 * @module render-scheduler
 */
import { renderScheduleConfig, RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';
import { ScheduledRender, ScheduledRenderExecution } from './scheduled-render';

export function customRenderScheduler(
    schedule: (this: void, task: (this: void) => void, config: RenderScheduleConfig) => void,
): RenderScheduler {

  let nextQueue: ScheduledRender[] = [];

  return options => {

    const config = renderScheduleConfig(options);
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
        get window() {
          return config.window;
        },
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
          config.error(e);
        }
      }
    }
  };
}
