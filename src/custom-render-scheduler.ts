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
        replace = () => {/* do not replace */},
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

/**
 * @internal
 */
const ScheduledRenderQ__symbol = Symbol('scheduled-render-q');

/**
 * @internal
 */
class ScheduledRenderQ {

  readonly ref: [ScheduledRenderQ];
  schedule: (this: ScheduledRenderQ, config: RenderScheduleConfig) => void;
  private scheduled?: RenderScheduleConfig;

  static by(queue: ScheduledRenderQueue, ref?: [ScheduledRenderQ]): ScheduledRenderQ {
    return (queue as any)[ScheduledRenderQ__symbol]
        || ((queue as any)[ScheduledRenderQ__symbol] = new ScheduledRenderQ(queue, ref));
  }

  private constructor(private readonly q: ScheduledRenderQueue, ref?: [ScheduledRenderQ]) {
    this.schedule = this.doSchedule;
    this.ref = ref || [this];
  }

  add(render: ScheduledRender): void {
    this.q.add(render);
  }

  private doSchedule(config: RenderScheduleConfig): void {
    this.schedule = () => {/* do not schedule */};

    const execution: ScheduledRenderExecution = {
      get config() {
        return config;
      },
      postpone: postponed => this.add(postponed),
    };

    this.q.schedule(() => {

      const next = this.reset();

      next.suspend();
      this.exec(execution);
      next.resume();
    });
  }

  private exec(execution: ScheduledRenderExecution): void {
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
    return this.ref[0] = ScheduledRenderQ.by(this.q.reset(), this.ref);
  }

  private suspend(): void {
    this.schedule = config => {
      this.scheduled = config;
      this.schedule = () => {/* do not schedule */};
    };
  }

  private resume(): void {
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
    const queueRef = ScheduledRenderQ.by(options.newQueue(config)).ref;
    let enqueued: [ScheduledRenderQ, ScheduledRender] | [] = [];

    return render => {

      const [lastQueue] = enqueued;
      const [nextQueue] = queueRef;

      if (lastQueue === nextQueue) {
        enqueued[1] = render;
      } else {

        const nextEnqueued = enqueued = [nextQueue, render];

        nextQueue.add((execution: ScheduledRenderExecution) => nextEnqueued[1](execution));
      }

      nextQueue.schedule(config);
    };
  };
}
