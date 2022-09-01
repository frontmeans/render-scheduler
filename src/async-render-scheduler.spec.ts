import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asyncRenderScheduler } from './async-render-scheduler';
import type { RenderSchedule } from './render-schedule';

describe('asyncRenderScheduler', () => {
  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {
    schedule = asyncRenderScheduler();
    schedule2 = asyncRenderScheduler();
  });

  it('rendering is deferred', async () => {
    const shot = jest.fn();

    schedule(shot);
    expect(shot).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot).toHaveBeenCalledTimes(1);
  });
  it('executes only the last scheduled render shot', async () => {
    const shot1 = jest.fn();
    const shot2 = jest.fn();

    schedule(shot1);
    schedule(shot2);
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).toHaveBeenCalledTimes(1);
  });
  it('executes render shots from different schedules simultaneously', async () => {
    const shot1 = jest.fn();
    const shot2 = jest.fn();

    schedule(shot1);
    schedule2(shot2);
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).toHaveBeenCalledTimes(1);
  });
  it('recurrent render shot is deferred', async () => {
    const shot1 = jest.fn();
    const shot2 = jest.fn();

    shot1.mockImplementation(() => {
      schedule2(shot2);
    });
    schedule(shot1);

    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).toHaveBeenCalledTimes(1);
  });
  it('recurrent render shot in the same schedule is deferred', async () => {
    const shot1 = jest.fn();
    const shot2 = jest.fn();

    shot1.mockImplementation(() => {
      schedule(shot2);
    });
    schedule(shot1);

    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).toHaveBeenCalledTimes(1);
  });
});
