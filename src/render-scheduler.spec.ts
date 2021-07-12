import { nodeWindow } from '@frontmeans/dom-primitives';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { CxGlobals, CxReferenceError } from '@proc7ts/context-values';
import { Supply } from '@proc7ts/supply';
import type { Mock } from 'jest-mock';
import { CxWindow } from './cx-window';
import { immediateRenderScheduler } from './immediate-render-scheduler';
import { newRenderSchedule, setRenderScheduler } from './new-render-scheduler';
import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import { RenderScheduler } from './render-scheduler';

describe('setRenderScheduler', () => {

  let mockScheduler: Mock<ReturnType<RenderScheduler>, Parameters<RenderScheduler>>;
  let mockSchedule: Mock<void, Parameters<RenderSchedule>>;

  beforeEach(() => {
    mockScheduler = jest.fn((_options?: RenderScheduleOptions) => mockSchedule);
    mockSchedule = jest.fn();
  });
  afterEach(() => {
    setRenderScheduler();
  });

  beforeEach(() => {
    Supply.onUnexpectedAbort(() => void 0);
  });
  afterEach(() => {
    Supply.onUnexpectedAbort();
  });

  it('assigns scheduler', () => {
    expect(setRenderScheduler(mockScheduler)).toBe(mockScheduler);

    const options: RenderScheduleOptions = { window };
    const schedule = newRenderSchedule(options);

    expect(schedule).toBe(mockSchedule);
    expect(mockScheduler).toHaveBeenCalledWith(options);
  });

  describe('context entry', () => {

    let mockScheduler: Mock<RenderSchedule, Parameters<RenderScheduler>>;

    beforeEach(() => {
      mockScheduler = jest.fn(immediateRenderScheduler);
      setRenderScheduler(mockScheduler);
    });
    afterEach(() => {
      setRenderScheduler();
    });

    let mockWindow: CxWindow;
    let cxBuilder: CxBuilder;
    let scheduler: RenderScheduler;

    beforeEach(() => {
      mockWindow = { name: 'bootstrap-window' } as any;
      cxBuilder = new CxBuilder(get => ({ get }));
      cxBuilder.provide(cxConstAsset(CxGlobals, cxBuilder.context));
      cxBuilder.provide(cxConstAsset(CxWindow, mockWindow));
      scheduler = cxBuilder.get(RenderScheduler);
    });

    it('utilizes default render scheduler', () => {
      scheduler();
      expect(mockScheduler).toHaveBeenCalled();
    });
    it('substitutes node window when present', () => {

      const node = document.createElement('div');
      const error = (): void => { /* log error */ };

      scheduler({ node, error });
      expect(mockScheduler).toHaveBeenCalledWith({ window: nodeWindow(node), node, error });
    });
    it('substitutes default window when absent', () => {

      const error = (): void => { /* log error */ };

      scheduler({ error });
      expect(mockScheduler).toHaveBeenCalledWith({ window: mockWindow, error });
    });
    it('substitutes default window to provided scheduler', () => {

      const customScheduler = jest.fn<RenderSchedule, [RenderScheduleOptions?]>();

      cxBuilder.provide(cxConstAsset(RenderScheduler, customScheduler));

      const error = (): void => { /* log error */ };

      scheduler({ error });
      expect(customScheduler).toHaveBeenCalledWith({ window: mockWindow, error });
    });
    it('respects explicit parameters', () => {

      const window: Window = { name: 'window' } as any;
      const node = document.createElement('div');
      const error = (): void => { /* log error */ };

      scheduler({ window, node, error });
      expect(mockScheduler).toHaveBeenCalledWith({ window, node, error });
    });
    it('becomes unavailable after context disposal', () => {

      const reason = new Error('Test reason');

      cxBuilder.supply.off(reason);

      const window: Window = { name: 'window' } as any;
      const node = document.createElement('div');
      const error = (): void => { /* log error */ };

      expect(() => scheduler({ window, node, error }))
          .toThrow(new CxReferenceError(RenderScheduler, 'The [RenderScheduler] is unavailable', reason));
      expect(mockScheduler).not.toHaveBeenCalled();
    });
    it('is singleton', () => {

      const cxBuilder2 = new CxBuilder(get => ({ get }), cxBuilder);

      expect(cxBuilder2.get(RenderScheduler)).toBe(scheduler);
    });

    describe('toString', () => {
      it('returns string representation', () => {
        expect(String(RenderScheduler)).toBe('[RenderScheduler]');
      });
    });
  });
});
