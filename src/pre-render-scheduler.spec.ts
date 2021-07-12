import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { CxWindow } from './cx-window';
import { PreRenderScheduler } from './pre-render-scheduler';

describe('PreRenderScheduler', () => {

  let mockWindow: CxWindow;
  let cxBuilder: CxBuilder;
  let scheduler: PreRenderScheduler;

  beforeEach(() => {
    mockWindow = { name: 'bootstrap-window' } as any;
    cxBuilder = new CxBuilder(get => ({ get }));
    cxBuilder.provide(cxConstAsset(CxWindow, mockWindow));
    scheduler = cxBuilder.get(PreRenderScheduler);
  });

  it('utilizes asynchronous render scheduler', async () => {

    const shot = jest.fn();

    scheduler()(shot);
    expect(shot).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot).toHaveBeenCalled();
  });

  describe('toString', () => {
    it('returns string representation', () => {
      expect(String(PreRenderScheduler)).toBe('[PreRenderScheduler]');
    });
  });
});
