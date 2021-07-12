import { RenderSchedule, RenderScheduleConfig, RenderScheduleOptions } from './render-schedule';
import type { RenderScheduler } from './render-scheduler';
import type { RenderExecution, RenderShot } from './render-shot';

/**
 * Render scheduler that executes render shots immediately.
 */
export const immediateRenderScheduler: RenderScheduler = (options?: RenderScheduleOptions): RenderSchedule => {

  const config = RenderScheduleConfig.by(options);

  return (shot: RenderShot): void => {

    const postponed: RenderShot[] = [];
    const execution: RenderExecution = {
      get config() {
        return config;
      },
      postpone(shot) {
        postponed.push(shot);
      },
    };

    execute(shot);
    for (; ;) {

      const last = postponed.pop();

      if (!last) {
        break;
      }

      execute(last);
    }

    function execute(shot: RenderShot): void {
      try {
        shot(execution);
      } catch (e) {
        config.error(e);
      }
    }
  };
};
