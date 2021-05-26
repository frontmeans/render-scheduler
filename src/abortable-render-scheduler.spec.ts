import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Supply } from '@proc7ts/supply';
import type { AbortableRenderScheduler } from './abortable-render-scheduler';
import { AbortableRenderExecution, newAbortableRenderScheduler } from './abortable-render-scheduler';
import type { ManualRenderScheduler } from './manual-render-scheduler';
import { newManualRenderScheduler } from './manual-render-scheduler';

describe('AbortableRenderScheduler', () => {

  let scheduler: ManualRenderScheduler;
  let abortable: AbortableRenderScheduler;

  beforeEach(() => {
    scheduler = newManualRenderScheduler();
    abortable = newAbortableRenderScheduler(scheduler);
  });

  let out: number[];

  beforeEach(() => {
    out = [];
  });

  it('schedules by another scheduler', () => {
    abortable()(() => out.push(1));
    expect(out).toHaveLength(0);

    scheduler.render();
    expect(out).toEqual([1]);
  });

  describe('schedule supply', () => {
    it('is passed to render shot', () => {

      const schedule = abortable();
      let renderExec: AbortableRenderExecution | undefined;

      schedule(exec => {
        renderExec = exec;
      });

      scheduler.render();
      expect(renderExec?.supply).toBe(schedule.supply);
    });
    it('is passed to postponed render shot', () => {

      const schedule = abortable();
      let postponedExec: AbortableRenderExecution | undefined;

      schedule(({ postpone }) => {
        postpone(exec => {
          postponedExec = exec;
        });
      });

      scheduler.render();
      expect(postponedExec?.supply).toBe(schedule.supply);
    });
  });

  describe('supply', () => {
    it('can be specified explicitly', () => {

      const supply = new Supply();

      abortable = newAbortableRenderScheduler(scheduler, supply);
      expect(abortable.supply).toBe(supply);
    });
    it('reports error on attempt to schedule render shot in existing schedule', () => {

      const whenOff = jest.fn();
      const supply = new Supply(whenOff);
      const error = jest.fn();
      const schedule = abortable({ error, supply });

      abortable.supply.off('reason');
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(schedule.supply).toBe(supply);

      schedule(() => out.push(1));
      expect(error).toHaveBeenCalledWith('Rendering aborted', 'reason');

      scheduler.render();
      expect(out).toHaveLength(0);
    });
    it('reports error on attempt to schedule render shot in new schedule', () => {
      abortable.supply.whenOff(() => { /* noop */ }).off('reason');

      const whenOff = jest.fn();
      const supply = new Supply(whenOff);
      const error = jest.fn();
      const schedule = abortable({ error, supply });

      expect(whenOff).toHaveBeenCalledWith('reason');

      schedule(() => out.push(1));
      expect(error).toHaveBeenCalledWith('Rendering aborted', 'reason');

      scheduler.render();
      expect(out).toHaveLength(0);
    });
    it('does not render once cut off', () => {

      const whenOff = jest.fn();
      const supply = new Supply(whenOff);
      const error = jest.fn();

      abortable({ error, supply })(() => out.push(1));
      abortable.supply.off('reason');
      expect(whenOff).toHaveBeenCalledWith('reason');
      scheduler.render();

      expect(out).toHaveLength(0);
      expect(error).not.toHaveBeenCalled();
    });
  });

});
