import { ManualRenderScheduler, newManualRenderScheduler } from './manual-render-scheduler';
import { RenderSchedule } from './render-schedule';

describe('manualRenderScheduler', () => {

  let scheduler: ManualRenderScheduler;
  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {
    scheduler = newManualRenderScheduler();
    schedule = scheduler();
    schedule2 = scheduler();
  });

  describe('render', () => {
    it('returns `false` when no renders scheduled', () => {
      expect(scheduler.render()).toBe(false);
    });
    it('executes scheduled renders by request', () => {

      const render1 = jest.fn();
      const render2 = jest.fn();
      const render3 = jest.fn();

      schedule(render1);
      schedule2(render2);
      schedule2(render3);

      expect(render1).not.toHaveBeenCalled();
      expect(render2).not.toHaveBeenCalled();
      expect(render3).not.toHaveBeenCalled();

      expect(scheduler.render()).toBe(true);
      expect(render1).toHaveBeenCalled();
      expect(render2).not.toHaveBeenCalled();
      expect(render3).toHaveBeenCalled();

      expect(scheduler.render()).toBe(false);
      expect(render1).toHaveBeenCalledTimes(1);
      expect(render2).not.toHaveBeenCalled();
      expect(render3).toHaveBeenCalledTimes(1);
    });
  });

});
