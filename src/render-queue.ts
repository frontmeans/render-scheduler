import type { RenderShot } from './render-shot';

/**
 * A queue of scheduled render shots.
 *
 * Utilized by render scheduler in order to collect render shots and schedule their execution.
 *
 * The default implementation may be constructed using {@link RenderQueue.by} function.
 */
export interface RenderQueue {

  /**
   * Adds a render shot to this queue.
   *
   * @param shot - Scheduled render shot to add.
   */
  add(shot: RenderShot): void;

  /**
   * Adds a render shot to the head of this queue.
   *
   * @param shot - Scheduled render shot to add.
   */
  post(shot: RenderShot): void;

  /**
   * Retrieves the first added render shot and removes it from the queue.
   *
   * @returns  Either pulled out render shot, or `undefined` when there is no more render shots.
   */
  pull(): RenderShot | undefined;

  /**
   * Schedules queued render shots execution.
   *
   * @param task - A function that performs render shots execution task.
   */
  schedule(task: (this: void) => void): void;

  /**
   * Schedules recurrent render shots execution.
   *
   * When defined, this method is responsible for execution of render shots scheduled during preceding render shots
   * execution.
   *
   * When not defined, it is expected that {@link schedule} executes all scheduled render shots, including recurrent
   * ones.
   *
   * @param task - A function that performs render shots execution task. Should not be executed if there is no
   * recurrent shots.
   */
  recur?(task: (this: void) => void): void;

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
   * @param schedule - Schedules queued render shots execution. This is an implementation of
   * {@link RenderQueue.schedule} method.
   * @param recur - Schedules recurrent render shots execution. This is an implementation of
   * {@link RenderQueue.recur} method.
   * @param replace - Called right after {@link RenderQueue.reset} method in order to inform on the queue that will
   * collect scheduled render shots from now.
   *
   * @returns New render queue.
   */
  by(
      this: void,
      {
        schedule,
        recur,
        replace = RenderQueue$doNotReplace,
      }: {
        schedule(this: void, task: (this: void) => void): void;
        recur?(this: void, task: (this: void) => void): void;
        replace?(this: void, replacement: RenderQueue): void;
      },
  ): RenderQueue {

    let scheduled: RenderShot[] = [];
    let executed: RenderShot[] = scheduled;

    const scheduleRecurrent = recur;

    if (scheduleRecurrent) {
      recur = task => {
        if (scheduled.length) {
          executed = scheduled;
          scheduled = [];
          scheduleRecurrent(task);
        } else {
          // No recurrent shots.
          // The upcoming shots are non-recurrent.
          scheduled = executed;
        }
      };

      const replaceQueue = replace;

      replace = next => {
        scheduled = [];
        replaceQueue(next);
      };
    }

    return {
      add(shot: RenderShot): void {
        scheduled.push(shot);
      },
      post(shot: RenderShot): void {
        scheduled.unshift(shot);
      },
      pull(): RenderShot | undefined {
        return executed.shift();
      },
      schedule,
      recur,
      reset() {

        const next = RenderQueue.by({ schedule, replace });

        replace(next);

        return next;
      },
    };
  },

};

function RenderQueue$doNotReplace(_replacement: RenderQueue): void {
  // Do not replace queue
}
