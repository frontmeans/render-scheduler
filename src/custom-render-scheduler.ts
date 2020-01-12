/**
 * @module render-scheduler
 */
import { RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';
import { ScheduledRender, ScheduledRenderExecution } from './scheduled-render';

export interface CustomRenderSchedulerOptions {
  newQueue(config: RenderScheduleConfig): ScheduledRenderQueue;
}

export interface ScheduledRenderQueue {
  readonly isEmpty: boolean;
  add(render: ScheduledRender): void;
  pull(): ScheduledRender | undefined;
  schedule(task: (this: void) => void): void;
  reset(): ScheduledRenderQueue;
}

export const ScheduledRenderQueue = {

  by(
      this: void,
      {
        replace = () => {},
        schedule,
      }: {
        schedule(this: ScheduledRenderQueue, task: (this: void) => void): void;
        replace?(this: void, replacement: ScheduledRenderQueue): void
      },
  ): ScheduledRenderQueue {

    const renders: ScheduledRender[] = [];

    return {
      schedule,
      get isEmpty() {
        return !renders.length;
      },
      add(render) {
        renders.push(render);
      },
      pull() {
        return renders.shift();
      },
      reset() {

        const replacement = ScheduledRenderQueue.by({ schedule, replace });

        replace(replacement);

        return replacement;
      },
    };
  },

};

export function customRenderScheduler(
    options: CustomRenderSchedulerOptions,
): RenderScheduler {
  return scheduleOptions => {

    const config = RenderScheduleConfig.by(scheduleOptions);
    let nextQueue = options.newQueue(config);
    let scheduleQueue: () => void = doScheduleQueue;
    let queued: [ScheduledRenderQueue, ScheduledRender] | [] = [];

    return render => {

      const queueStarted = nextQueue.isEmpty;
      const [queue] = queued;

      if (queue === nextQueue) {
        queued[1] = render;
      } else {

        const newQueued = queued = [nextQueue, render];

        nextQueue.add((execution: ScheduledRenderExecution) => newQueued[1](execution));
      }

      if (queueStarted) {
        scheduleQueue();
      }
    };

    function doScheduleQueue() {
      scheduleQueue = () => {};

      for (;;) {

        const lastQueue = nextQueue;

        lastQueue.schedule(() => exec());
        if (nextQueue === lastQueue || nextQueue.isEmpty) {
          break;
        }
      }

      scheduleQueue = doScheduleQueue;
    }

    function exec() {

      const queue = nextQueue;
      const execution: ScheduledRenderExecution = {
        get config() {
          return config;
        },
        postpone(postponed) {
          queue.add(postponed);
        },
      };

      nextQueue = queue.reset();
      for (; ;) {

        const render = queue.pull();

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
