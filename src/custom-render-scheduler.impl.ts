import { ScheduledRenderQueue } from './custom-render-scheduler';
import { RenderScheduleConfig } from './render-schedule';
import { ScheduledRender, ScheduledRenderExecution } from './scheduled-render';

/**
 * @internal
 */
export class CustomRenderScheduler {

  private schedule: (this: CustomRenderScheduler, config: RenderScheduleConfig) => void;
  private queued: [ScheduledRenderQueue, ScheduledRender] | [] = [];

  constructor(private queue: ScheduledRenderQueue) {
    this.schedule = this.doSchedule;
  }

  render(render: ScheduledRender, config: RenderScheduleConfig) {

    const queueStarted = this.queue.isEmpty;
    const [queue] = this.queued;

    if (queue === this.queue) {
      this.queued[1] = render;
    } else {

      const newQueued = this.queued = [this.queue, render];

      this.queue.add((execution: ScheduledRenderExecution) => newQueued[1](execution));
    }

    if (queueStarted) {
      this.schedule(config);
    }
  }

  private doSchedule(this: CustomRenderScheduler, config: RenderScheduleConfig) {
    this.schedule = () => {};

    for (;;) {

      const lastQueue = this.queue;

      lastQueue.schedule(() => this.exec(config));
      if (this.queue === lastQueue || this.queue.isEmpty) {
        break;
      }
    }

    this.schedule = this.doSchedule;
  }

  private exec(config: RenderScheduleConfig) {

    const queue = this.queue;
    const execution: ScheduledRenderExecution = {
      get config() {
        return config;
      },
      postpone(postponed) {
        queue.add(postponed);
      },
    };

    this.queue = queue.reset();
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

}
