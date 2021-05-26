import { beforeEach, describe, expect, it } from '@jest/globals';
import type { DelegateRenderScheduler } from './delegate-render-scheduler';
import { newDelegateRenderScheduler } from './delegate-render-scheduler';
import type { ManualRenderScheduler } from './manual-render-scheduler';
import { newManualRenderScheduler } from './manual-render-scheduler';
import type { RenderScheduler } from './render-scheduler';

describe('DelegateRenderScheduler', () => {

  let scheduler: ManualRenderScheduler;
  let delegate: DelegateRenderScheduler;
  let scheduleBy: (scheduler: RenderScheduler) => DelegateRenderScheduler;

  beforeEach(() => {
    scheduler = newManualRenderScheduler();
    delegate = newDelegateRenderScheduler(scheduler);
    scheduleBy = delegate.scheduleBy;
  });

  let out: number[];

  beforeEach(() => {
    out = [];
  });

  it('schedules rendering by another scheduler', () => {

    const schedule = delegate();

    schedule(() => out.push(1));
    expect(out).toHaveLength(0);

    scheduler.render();
    expect(out).toEqual([1]);
  });

  describe('scheduleBy', () => {

    let scheduler2: ManualRenderScheduler;

    beforeEach(() => {
      scheduler2 = newManualRenderScheduler();
    });

    it('creates new schedules in new scheduler', () => {

      expect(out).toHaveLength(0);
      expect(scheduleBy(scheduler2)).toBe(delegate);

      const schedule = delegate();

      schedule(() => out.push(1));
      scheduler.render();
      expect(out).toHaveLength(0);

      scheduler2.render();
      expect(out).toEqual([1]);
    });
    it('schedules new render shots by new scheduler', () => {

      const schedule = delegate();

      expect(out).toHaveLength(0);
      expect(scheduleBy(scheduler2)).toBe(delegate);

      schedule(() => out.push(1));
      scheduler.render();
      expect(out).toHaveLength(0);

      scheduler2.render();
      expect(out).toEqual([1]);
    });
    it('schedules old render shots by old scheduler', () => {

      const schedule = delegate();

      schedule(() => out.push(1));
      expect(out).toHaveLength(0);
      expect(scheduleBy(scheduler2)).toBe(delegate);

      scheduler.render();
      expect(out).toEqual([1]);

      scheduler2.render();
      expect(out).toEqual([1]);
    });
  });
});
