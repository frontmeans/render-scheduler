/**
 * @packageDocumentation
 * @module render-scheduler
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

  readonly ref: [RenderQ];
  schedule: (this: RenderQ, config: RenderScheduleConfig) => void;
  private scheduled?: RenderScheduleConfig;

  static by(queue: RenderQueue, ref?: [RenderQ]): RenderQ {
    return (queue as any)[RenderQ__symbol]
        || ((queue as any)[RenderQ__symbol] = new RenderQ(queue, ref));
  }

  private constructor(private readonly q: RenderQueue, ref?: [RenderQ]) {
    this.schedule = this.doSchedule;
    this.ref = ref || [this];
  }

  add(shot: RenderShot): void {
    this.q.add(shot);
  }

  private doSchedule(config: RenderScheduleConfig): void {
    this.schedule = () => {/* do not schedule */};

    const execution: RenderExecution = {
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
    const queueRef = RenderQ.by(options.newQueue(config)).ref;
    let enqueued: [RenderQ, RenderShot] | [] = [];

    return shot => {

      const [lastQueue] = enqueued;
      const [nextQueue] = queueRef;

      if (lastQueue === nextQueue) {
        enqueued[1] = shot;
      } else {

        const nextEnqueued = enqueued = [nextQueue, shot];

        nextQueue.add((execution: RenderExecution) => {
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

      nextQueue.schedule(config);
    };
  };
}
