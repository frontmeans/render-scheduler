import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';
import { newRenderSchedule } from './new-render-scheduler';
import type { RenderSchedule, RenderScheduleOptions } from './render-schedule';

describe('animationRenderScheduler', () => {

  let mockWindow: Window;
  let mockError: Mock<(...error: unknown[]) => void>;
  let animate: () => void;

  beforeEach(() => {
    mockError = jest.fn();
    mockWindow = {
      requestAnimationFrame: jest.fn((cb: () => void) => animate = cb),
    } as any;
  });

  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {

    const options: RenderScheduleOptions = { window: mockWindow, error: mockError };

    schedule = newRenderSchedule(options);
    schedule2 = newRenderSchedule(options);
  });

  let errors: unknown[];

  beforeEach(() => {
    errors = [];
  });
  afterEach(() => {
    errors.forEach(e => { throw e; });
  });

  it('renders when in animation frame', () => {

    const shot = jest.fn();

    schedule(shot);
    expect(shot).not.toHaveBeenCalled();
    animate();
    expect(shot).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ window: mockWindow }),
    }));
    expect(shot).toHaveBeenCalledTimes(1);
  });
  it('executes render shots from different schedules in single animation frame', () => {

    const shot1 = jest.fn();
    const shot2 = jest.fn();

    schedule(shot1);
    schedule2(shot2);
    expect(mockWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();

    animate();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).toHaveBeenCalledTimes(1);
  });
  it('executes render shots from different windows in different animation frames', () => {

    const mockWindow3: Window = {
      requestAnimationFrame: jest.fn(),
    } as any;
    const schedule3 = newRenderSchedule({ window: mockWindow3 });
    const shot1 = jest.fn();
    const shot2 = jest.fn();
    const shot3 = jest.fn();

    schedule(shot1);
    schedule2(shot2);
    schedule3(shot3);
    expect(mockWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(mockWindow3.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).not.toHaveBeenCalled();

    animate();
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).toHaveBeenCalledTimes(1);
    expect(shot3).not.toHaveBeenCalled();
  });
  it('executes only the last render shot scheduled in one schedule', () => {

    const shot1 = jest.fn();
    const shot2 = jest.fn();

    schedule(shot1);
    schedule(shot2);
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    animate();
    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).toHaveBeenCalledTimes(1);
  });
  it('executes postponed render shot after the main one', () => {

    const postponed = jest.fn();

    schedule(execution => {
      execution.postpone(postponed);
      try {
        expect(postponed).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    animate();
    expect(postponed).toHaveBeenCalledTimes(1);
  });
  it('executes all postponed render shots in reverse order', () => {

    const postponed1 = jest.fn();
    const postponed2 = jest.fn();
    const postponed3 = jest.fn();

    schedule(execution => {
      execution.postpone(ex => ex.postpone(postponed3));
      execution.postpone(
          postponed1.mockImplementation(
              () => {
                try {
                  expect(postponed2).toHaveBeenCalled();
                  expect(postponed3).not.toHaveBeenCalled();
                } catch (e) {
                  errors.push(e);
                }
              },
          ),
      );
      execution.postpone(
          postponed2.mockImplementation(
              () => {
                try {
                  expect(postponed1).not.toHaveBeenCalled();
                  expect(postponed3).not.toHaveBeenCalled();
                } catch (e) {
                  errors.push(e);
                }
              },
          ),
      );
    });

    animate();
    expect(postponed1).toHaveBeenCalledTimes(1);
    expect(postponed2).toHaveBeenCalledTimes(1);
    expect(postponed3).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shot in next animation frame', () => {

    const nextRender = jest.fn();

    schedule(() => {
      schedule(nextRender);
    });

    animate();
    expect(nextRender).not.toHaveBeenCalled();
    animate();
    expect(nextRender).toHaveBeenCalledTimes(1);
  });
  it('executes only the last recurrent render shot after currently executing one', () => {

    const nextRender1 = jest.fn();
    const nextRender2 = jest.fn();

    schedule(() => {
      schedule(nextRender1);
      schedule(nextRender2);
    });

    animate();
    expect(nextRender1).not.toHaveBeenCalled();
    expect(nextRender2).not.toHaveBeenCalled();

    animate();
    expect(nextRender1).not.toHaveBeenCalled();
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('executes render shot in stale schedule', () => {

    const nextRender1 = jest.fn();
    const nextRender2 = jest.fn();
    const nextRender3 = jest.fn();

    schedule(() => {
      schedule(nextRender1.mockImplementation(() => {
        schedule2(nextRender3); // This schedule is stale
        schedule(nextRender2);
      }));
      try {
        expect(nextRender1).not.toHaveBeenCalled();
        expect(nextRender2).not.toHaveBeenCalled();
        expect(nextRender2).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    animate();
    expect(nextRender1).not.toHaveBeenCalled();
    expect(nextRender2).not.toHaveBeenCalled();
    expect(nextRender3).not.toHaveBeenCalled();

    animate();
    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).not.toHaveBeenCalled();
    expect(nextRender3).toHaveBeenCalled();

    animate();
    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).toHaveBeenCalledTimes(1);
    expect(nextRender3).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shots in the same and another schedule after currently executing one', () => {

    const nextRender1 = jest.fn();
    const nextRender2 = jest.fn();

    schedule(() => {
      schedule(nextRender1);
      schedule2(nextRender2);
      try {
        expect(nextRender1).not.toHaveBeenCalled();
        expect(nextRender2).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    animate();
    expect(nextRender1).not.toHaveBeenCalled();
    expect(nextRender2).toHaveBeenCalled();

    animate();
    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shots in another and the same schedule after currently executing one', () => {

    const nextRender1 = jest.fn();
    const nextRender2 = jest.fn();

    schedule(() => {
      schedule2(nextRender2);
      schedule(nextRender1);
      try {
        expect(nextRender1).not.toHaveBeenCalled();
        expect(nextRender2).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    animate();
    expect(nextRender1).not.toHaveBeenCalled();
    expect(nextRender2).toHaveBeenCalled();

    animate();
    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('logs error and executes recurrent render shot after error', () => {

    const error = new Error('Expected');
    const nextRender = jest.fn();

    schedule(() => {
      schedule(nextRender);
      throw error;
    });

    animate();
    animate();
    expect(nextRender).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenCalledWith(error);
  });
});
