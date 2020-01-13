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
   * Whether this queue contains no renders.
   */
  readonly isEmpty: boolean;

  /**
   * Whether this queue already {@link schedule scheduled}.
   */
  readonly scheduled: boolean;

  /**
   * Actual queue to add renders to.
   *
   * This is the same as `this` until the queue is [[reset]].
   */
  readonly next: ScheduledRenderQueue;

  /**
   * Adds a render to this queue.
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
   * This is called only once per queue. The [[scheduled]] property must become `true` after that.
   *
   * @param task  A function that performs scheduled renders execution task.
   */
  schedule(task: (this: void) => void): void;

  /**
   * Resets the queue for the next execution.
   *
   * This is called only once per queue. The [[next]] property must return a result of this call after that.
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
        schedule(this: void, task: (this: void) => void): void;
        replace?(this: void, replacement: ScheduledRenderQueue): void;
      },
  ): ScheduledRenderQueue {

    const renders: ScheduledRender[] = [];
    let scheduled = false;
    let next: ScheduledRenderQueue | undefined;

    return {
      get isEmpty() {
        return !renders.length;
      },
      get scheduled() {
        return scheduled;
      },
      get next() {
        return next && next.next || this;
      },
      schedule(task) {
        scheduled = true;
        schedule(task);
      },
      add(render) {
        renders.push(render);
      },
      pull() {
        return renders.shift();
      },
      reset() {
        next = ScheduledRenderQueue.by({ schedule, replace });
        replace(next);
        return next;
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

      const scheduled = nextQueue.scheduled; // Check it here to prevent immediate execution _recurrently_
      const [queue] = queued;

      nextQueue = nextQueue.next;
      if (queue === nextQueue) {
        queued[1] = render;
      } else {

        const newQueued = queued = [nextQueue, render];

        nextQueue.add((execution: ScheduledRenderExecution) => newQueued[1](execution));
      }

      if (!scheduled) {
        scheduleQueue();
      }
    };

    function doScheduleQueue() {
      scheduleQueue = () => {};

      for (;;) {

        let immediatelyExecuted = false;

        nextQueue.schedule(() => {
          immediatelyExecuted = true;
          exec();
        });
        if (!immediatelyExecuted || nextQueue.isEmpty) {
          break;
        }
        // The are more immediately executed tasks
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
