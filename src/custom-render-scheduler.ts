/**
 * @packageDocumentation
 * @module @proc7ts/render-scheduler
 */
import { RenderQueue } from './render-queue';
import { RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';
import { RenderExecution, RenderShot } from './render-shot';

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
   * @returns  A queue of scheduled render shots.
   */
  newQueue(config: RenderScheduleConfig): RenderQueue;

}

/**
 * @internal
 */
const RenderQ__symbol = Symbol('render-q');

/**
 * @internal
 */
class RenderQ {

  readonly ref: [RenderQ, RenderQ];
  schedule: (this: RenderQ, config: RenderScheduleConfig) => void;
  private scheduled?: RenderScheduleConfig;

  static by(queue: RenderQueue, ref?: [RenderQ, RenderQ]): RenderQ {
    return (queue as any)[RenderQ__symbol]
        || ((queue as any)[RenderQ__symbol] = new RenderQ(queue, ref));
  }

  private constructor(private readonly q: RenderQueue, ref?: [RenderQ, RenderQ]) {
    this.schedule = this.doSchedule;
    this.ref = ref || [this, this];
  }

  add(shot: RenderShot): void {
    this.q.add(shot);
  }

  private doSchedule(config: RenderScheduleConfig): void {
    this.schedule = () => {/* do not schedule */};

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

      next.suspend();
      this.exec(execution);
      // Activate next queue
      this.ref[1] = this.ref[0];
      // Postponed shots are executed immediately from now on
      execution.postpone = shot => shot(execution);
      // Execute postponed shots (in reverse order)
      postponed.forEach(shot => this.q.add(shot));
      this.exec(execution);
      next.resume();
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

  private reset(): RenderQ {
    // Update next queue. Current queue remains active
    return this.ref[0] = RenderQ.by(this.q.reset(), this.ref);
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
    const queueRef: readonly [RenderQ, RenderQ] = RenderQ.by(options.newQueue(config)).ref;
    let enqueued: [RenderQ, RenderShot, true?] | [] = [];

    return shot => {

      const [lastQueue,, executed] = enqueued;
      const [nextQueue, activeQueue] = queueRef;
      let queue = lastQueue || activeQueue;

      if (lastQueue === activeQueue && !executed || lastQueue === nextQueue) {
        enqueued[1] = shot;
      } else {

        // Add to active queue initially, unless a shot executed in it already.
        // Add to the next queue otherwise.
        const nextEnqueued: [RenderQ, RenderShot, true?] = enqueued = [
          queue = executed ? nextQueue : activeQueue,
          shot,
        ];

        queue.add((execution: RenderExecution) => {
          nextEnqueued[2] = true; // Switch to next queue
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
