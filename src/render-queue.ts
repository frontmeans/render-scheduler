/**
 * @packageDocumentation
 * @module render-scheduler
 */
import { RenderShot } from './render-shot';

/**
 * A queue of scheduled render shots.
 *
 * Utilized by render scheduler in order to collect render shots and schedule their execution.
 *
 * The default implementation may be constructed using [[ScheduledRenderQueue.by]] function.
 */
export interface RenderQueue {

  /**
   * Adds a render shot to this queue.
   *
   * @param shot  Scheduled render shot to add.
   */
  add(shot: RenderShot): void;

  /**
   * Retrieves the first added render shot and removes it from the queue.
   *
   * @returns  Either pulled out render shot, or `undefined` when there is no more render shots.
   */
  pull(): RenderShot | undefined;

  /**
   * Schedules queued render shots execution.
   *
   * @param task  A function that performs render shots execution task.
   */
  schedule(task: (this: void) => void): void;

  /**
   * Resets the queue for the next execution.
   *
   * @returns  Another (empty) queue that will collect scheduled render shots from now on.
   */
  reset(): RenderQueue;

}

export const RenderQueue = {

  /**
   * Builds the default implementation of render queue.
   *
   * @param schedule  Schedules queued render shots execution. This is an implementation of
   * [[ScheduledRenderQueue.schedule]] method.
   * @param replace  Called right after [[ScheduledRenderQueue.reset]] method in order to inform on the queue that will
   * collect scheduled render shots from now.
   *
   * @returns New render queue.
   */
  by(
      this: void,
      {
        schedule,
        replace = () => {/* do not replace */},
      }: {
        schedule(this: RenderQueue, task: (this: void) => void): void;
        replace?(this: void, replacement: RenderQueue): void;
      },
  ): RenderQueue {

    const shots: RenderShot[] = [];

    return {
      schedule,
      add(shot) {
        shots.push(shot);
      },
      pull() {
        return shots.shift();
      },
      reset() {

        const next = RenderQueue.by({ schedule, replace });

        replace(next);

        return next;
      },
    };
  },

};
