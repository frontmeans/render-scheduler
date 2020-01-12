/**
 * @module render-scheduler
 */
import { RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';
import { ScheduledRender, ScheduledRenderExecution } from './scheduled-render';

/**
 * Custom render scheduler options.
 *
 * This is passed to [[customRenderScheduler]] function to construct new custom scheduler.
 */
export interface CustomRenderSchedulerOptions {

  /**
   * Obtains a queue for render schedule.
   *
   * This is called once per render schedule.
   *
   * Render schedules may share the queue.
   *
   * @param config  Render schedule configuration.
   *
   * @returns  Scheduled render queue.
   */
  newQueue(config: RenderScheduleConfig): ScheduledRenderQueue;
}

/**
 * A queue of scheduled renders.
 *
 * Utilized by render scheduler in order to collect scheduled renders and schedule their execution.
 *
 * The default implementation may constructed using [[ScheduledRenderQueue.by]] function.
 */
export interface ScheduledRenderQueue {

  /**
   * `true` when this queue is empty, or `false` when it contains at least one render.
   */
  readonly isEmpty: boolean;

  /**
   * Add a render to this queue.
   *
   * @param render  Scheduled render to add.
   */
  add(render: ScheduledRender): void;

  /**
   * Retrieves the first added render and removes it from the queue.
   *
   * @returns  Either pulled out scheduled render, or `undefined` when there is no more renders.
   */
  pull(): ScheduledRender | undefined;

  /**
   * Schedules queued renders execution.
   *
   * @param task  A function that performs scheduled renders execution task.
   */
  schedule(task: (this: void) => void): void;

  /**
   * Resets the queue for the next execution.
   *
   * @returns  Another (empty) queue that will collect scheduled renders from now on.
   */
  reset(): ScheduledRenderQueue;

}

export const ScheduledRenderQueue = {

  /**
   * Builds the default implementation of scheduled renders queue.
   *
   * @param schedule  Schedules queued renders execution. This is an implementation of
   * [[ScheduledRenderQueue.schedule]] method.
   * @param replace  Called right after [[ScheduledRenderQueue.reset]] method in order to inform on queue that will
   * collect scheduled renders from now.
   *
   * @returns New scheduled render queue.
   */
  by(
      this: void,
      {
        schedule,
        replace = () => {},
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

/**
 * Builds custom render scheduler.
 *
 * @param options  Render scheduler options.
 *
 * @returns New render scheduler.
 */
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
