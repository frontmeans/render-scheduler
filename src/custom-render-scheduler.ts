/**
 * @module render-scheduler
 */
import { CustomRenderScheduler } from './custom-render-scheduler.impl';
import { RenderScheduleConfig } from './render-schedule';
import { RenderScheduler } from './render-scheduler';
import { ScheduledRender } from './scheduled-render';

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
    const scheduler = new CustomRenderScheduler(options.newQueue(config));

    return render => scheduler.render(render, config);
  };
}
