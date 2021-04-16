import type { RenderQueue } from './render-queue';
import { RenderSchedule, RenderScheduleConfig, RenderScheduleOptions } from './render-schedule';
import type { RenderScheduler } from './render-scheduler';
import type { RenderExecution, RenderShot } from './render-shot';

/**
 * Custom render scheduler options.
 *
 * This is passed to {@link customRenderScheduler} function to construct new custom scheduler.
 */
export interface CustomRenderSchedulerOptions {

  /**
   * Obtains a queue for render schedule.
   *
   * This is called once per render schedule.
   *
   * Render schedules may share the queue.
   *
   * @param config - Render schedule configuration.
   *
   * @returns  A queue of scheduled render shots.
   */
  newQueue(config: RenderScheduleConfig): RenderQueue;

}

const RenderQ__symbol = (/*#__PURE__*/ Symbol('render-q'));

interface RenderQueue$Internal extends RenderQueue {
  [RenderQ__symbol]?: RenderQ;
}

class RenderQ {

  readonly ref: RenderQ$Ref;
  schedule: (this: RenderQ, config: RenderScheduleConfig) => void;
  private scheduled?: RenderScheduleConfig;
  private readonly execute: (
      this: this,
      execution: RenderExecution,
      done: () => void,
  ) => void;

  static by(queue: RenderQueue$Internal, ref?: RenderQ$Ref): RenderQ {
    return queue[RenderQ__symbol]
        || (queue[RenderQ__symbol] = new RenderQ(queue, ref));
  }

  private constructor(readonly q: RenderQueue, ref?: [RenderQ, RenderQ]) {
    this.schedule = this.doSchedule;
    this.ref = ref || [this, this];
    this.execute = q.recur ? this.execRecurring : this.execNonRecurring;
  }

  add(shot: RenderShot): void {
    this.q.add(shot);
  }

  private doSchedule(config: RenderScheduleConfig): void {
    // At most one execution at a time.
    this.schedule = RenderQ$doNotSchedule;

    const postponed: RenderShot[] = [];
    const execution: RenderExecution = {
      get config() {
        return config;
      },
      postpone(shot) {
        postponed.unshift(shot);
      },
    };

    this.q.schedule(() => {

      const next = this.reset();
      const done = (): void => {

        // Activate next queue.
        this.ref[1] = this.ref[0];
        // Schedule postponed shots (in reverse order).
        postponed.forEach(shot => this.q.add(shot));
        // Recurrently postponed shots are executed immediately after their initiators.
        execution.postpone = shot => this.q.post(shot);
        // Execute postponed shots.
        this.exec(execution);

        next.resume();
      };

      next.suspend();

      this.execute(execution, done);
    });
  }

  private exec(execution: RenderExecution): void {
    for (; ;) {

      const shot = this.q.pull();

      if (!shot) {
        break;
      }

      shot(execution);
    }
  }

  private execNonRecurring(execution: RenderExecution, done: () => void): void {
    this.exec(execution);
    done();
  }

  private execRecurring(execution: RenderExecution, done: () => void): void {

    const execute = (): void => {
      this.exec(execution);
      if (!this.q.recur!(execute)) {
        done();
      }
    };

    execute();
  }

  private reset(): RenderQ {
    // Update next queue. Current queue remains active
    return this.ref[0] = RenderQ.by(this.q.reset(), this.ref);
  }

  private suspend(): void {
    this.schedule = config => {
      // Remember execution to schedule.
      // It will be scheduled on resume.
      this.scheduled = config;

      // No need to remember more than one execution to schedule.
      this.schedule = RenderQ$doNotSchedule;
    };
  }

  private resume(): void {
    if (this.scheduled) {
      // There is an execution to schedule.
      this.doSchedule(this.scheduled);
    } else {
      // Resume normal execution scheduling.
      this.schedule = this.doSchedule;
    }
  }

}

type RenderQ$Ref = [next: RenderQ, active: RenderQ];

function RenderQ$doNotSchedule(_config: RenderScheduleConfig): void {
  // Do not schedule.
}

/**
 * Builds custom render scheduler.
 *
 * @param options - Render scheduler options.
 *
 * @returns New render scheduler.
 */
export function customRenderScheduler(
    options: CustomRenderSchedulerOptions,
): RenderScheduler {
  return (scheduleOptions?: RenderScheduleOptions): RenderSchedule => {

    const config = RenderScheduleConfig.by(scheduleOptions);
    const queueRef: Readonly<RenderQ$Ref> = RenderQ.by(options.newQueue(config)).ref;
    let enqueued: [RenderQ, RenderShot, true?] | [] = [];

    return (shot: RenderShot): void => {

      const [lastQueue,, executed] = enqueued;
      const [nextQueue, activeQueue] = queueRef;
      let queue = lastQueue || activeQueue;

      if ((lastQueue === activeQueue && !executed) || lastQueue === nextQueue) {
        // Replace the shot in active queue, unless executed already.
        // Replace the shot in the next queue unconditionally.
        enqueued[1] = shot;
      } else {

        // Add to active queue if no shot executed in this schedule yet, or the queue recurrent.
        // Add to the next queue otherwise.
        const nextEnqueued: [RenderQ, RenderShot, true?] = enqueued = [
          queue = !executed || queue.q.recur ? activeQueue : nextQueue,
          shot,
        ];

        queue.add((execution: RenderExecution) => {
          nextEnqueued[2] = true; // Switch to the next queue.
          try {
            nextEnqueued[1]({
              get config() {
                return config;
              },
              postpone(postponed) {
                execution.postpone(postponed);
              },
            });
          } catch (e) {
            config.error(e);
          }
        });
      }

      queue.schedule(config);
    };
  };
}
