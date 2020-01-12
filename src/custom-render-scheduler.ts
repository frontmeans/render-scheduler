/**
 * @module render-scheduler
 */
import { RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';
import { ScheduledRender, ScheduledRenderExecution } from './scheduled-render';

export interface CustomRenderSchedulerOptions {
  schedule(task: (this: void) => void): void;
}

export function customRenderScheduler(
    options:
        | CustomRenderSchedulerOptions
        | ((this: void, config: RenderScheduleConfig) => CustomRenderSchedulerOptions),
): RenderScheduler {

  let nextQueue: ScheduledRender[] = [];

  return scheduleOptions => {

    const config = RenderScheduleConfig.by(scheduleOptions);
    const schedulerOptions = typeof options === 'function' ? options(config) : options;
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

        schedulerOptions.schedule(executeRenders);
        if (nextQueue === lastQueue || !nextQueue.length) {
          break;
        }
      }
      scheduleQueue = doScheduleQueue;
    }

    function executeRenders() {

      const queue = nextQueue;
      const execution: ScheduledRenderExecution = {
        get config() {
          return config;
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
