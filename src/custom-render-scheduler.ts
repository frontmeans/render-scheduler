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
        schedule(this: ScheduledRenderQueue, task: (this: void) => void): void;
        replace?(this: void, replacement: ScheduledRenderQueue): void;
      },
  ): ScheduledRenderQueue {

    const renders: ScheduledRender[] = [];

    return {
      schedule,
      add(render) {
        renders.push(render);
      },
      pull() {
        return renders.shift();
      },
      reset() {

        const next = ScheduledRenderQueue.by({ schedule, replace });

        replace(next);

        return next;
      },
    };
  },

};

const ScheduledRenderQ__symbol = Symbol('scheduled-render-q');

class ScheduledRenderQ {

  schedule: (this: ScheduledRenderQ, config: RenderScheduleConfig) => void;
  private scheduled?: RenderScheduleConfig;
  private _next?: ScheduledRenderQ;

  static by(queue: ScheduledRenderQueue): ScheduledRenderQ {
    return (queue as any)[ScheduledRenderQ__symbol]
        || ((queue as any)[ScheduledRenderQ__symbol] = new ScheduledRenderQ(queue));
  }

  private constructor(private readonly q: ScheduledRenderQueue) {
    this.schedule = this.doSchedule;
  }

  get next(): ScheduledRenderQ {
    return this._next || this;
  }

  add(render: ScheduledRender) {
    this.q.add(render);
  }

  private doSchedule(config: RenderScheduleConfig) {
    this.schedule = () => {};

    const execution: ScheduledRenderExecution = {
      get config() {
        return config;
      },
      postpone: (postponed) => {
        this.add(postponed);
      },
    };

    this.q.schedule(() => {

      const next = this.reset();

      next.suspend();
      this.exec(execution);
      next.resume();
    });
  }

  private exec(execution: ScheduledRenderExecution) {
    for (; ;) {

      const render = this.q.pull();

      if (!render) {
        break;
      }
      try {
        render(execution);
      } catch (e) {
        execution.config.error(e);
      }
    }
  }

  private reset(): ScheduledRenderQ {
    return this._next = ScheduledRenderQ.by(this.q.reset());
  }

  private suspend() {
    this.schedule = config => {
      this.scheduled = config;
      this.schedule = () => {};
    };
  }

  private resume() {
    if (this.scheduled) {
      this.doSchedule(this.scheduled);
    } else {
      this.schedule = this.doSchedule;
    }
  }

}

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
    let nextQueue = ScheduledRenderQ.by(options.newQueue(config));
    let queued: [ScheduledRenderQ, ScheduledRender] | [] = [];

    return render => {

      const [queue] = queued;

      nextQueue = nextQueue.next;
      if (queue === nextQueue) {
        queued[1] = render;
      } else {

        const nextQueued = queued = [nextQueue, render];

        nextQueue.add((execution: ScheduledRenderExecution) => nextQueued[1](execution));
      }

      nextQueue.schedule(config);
    };
  };
}
