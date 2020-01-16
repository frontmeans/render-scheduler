import { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import { newRenderSchedule } from './render-scheduler';
import Mocked = jest.Mocked;
import Mock = jest.Mock;

describe('animationRenderScheduler', () => {

  let mockWindow: Mocked<Window>;
  let mockError: Mock<void, [any]>;
  let animate: () => void;

  beforeEach(() => {
    mockError = jest.fn();
    mockWindow = {
      requestAnimationFrame: jest.fn(cb => animate = cb),
    } as any;
  });

  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {

    const options: RenderScheduleOptions = { window: mockWindow, error: mockError };

    schedule = newRenderSchedule(options);
    schedule2 = newRenderSchedule(options);
  });

  let errors: any[];

  beforeEach(() => {
    errors = [];
  });
  afterEach(() => {
    errors.forEach(e => { throw e; });
  });

  it('renders when in animation frame', () => {

    const render = jest.fn();

    schedule(render);
    expect(render).not.toHaveBeenCalled();
    animate();
    expect(render).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ window: mockWindow }),
    }));
    expect(render).toHaveBeenCalledTimes(1);
  });
  it('executes renders from different schedules in single animation frame', () => {

    const render1 = jest.fn();
    const render2 = jest.fn();

    schedule(render1);
    schedule2(render2);
    expect(mockWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(render1).not.toHaveBeenCalled();
    expect(render2).not.toHaveBeenCalled();

    animate();
    expect(render1).toHaveBeenCalledTimes(1);
    expect(render2).toHaveBeenCalledTimes(1);
  });
  it('executes renders from different windows in different animation frames', () => {

    const mockWindow3: Mocked<Window> = {
      requestAnimationFrame: jest.fn(),
    } as any;
    const schedule3 = newRenderSchedule({ window: mockWindow3 });
    const render1 = jest.fn();
    const render2 = jest.fn();
    const render3 = jest.fn();

    schedule(render1);
    schedule2(render2);
    schedule3(render3);
    expect(mockWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(mockWindow3.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(render1).not.toHaveBeenCalled();
    expect(render2).not.toHaveBeenCalled();
    expect(render3).not.toHaveBeenCalled();

    animate();
    expect(render1).toHaveBeenCalledTimes(1);
    expect(render2).toHaveBeenCalledTimes(1);
    expect(render3).not.toHaveBeenCalled();
  });
  it('executes only the last render scheduled in one schedule', () => {

    const render1 = jest.fn();
    const render2 = jest.fn();

    schedule(render1);
    schedule(render2);
    expect(render1).not.toHaveBeenCalled();
    expect(render2).not.toHaveBeenCalled();
    animate();
    expect(render1).not.toHaveBeenCalled();
    expect(render2).toHaveBeenCalledTimes(1);
  });
  it('executes postponed render after the main one', () => {

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
  it('executes all postponed renders in order', () => {

    const postponed1 = jest.fn();
    const postponed2 = jest.fn();

    schedule(execution => {
      execution.postpone(ex => ex.postpone(postponed2));
      execution.postpone(postponed1.mockImplementation(
          () => {
            try {
              expect(postponed2).not.toHaveBeenCalled();
            } catch (e) {
              errors.push(e);
            }
          }),
      );
    });

    animate();
    expect(postponed1).toHaveBeenCalledTimes(1);
    expect(postponed2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render in next animation frame', () => {

    const nextRender = jest.fn();

    schedule(() => {
      schedule(nextRender);
    });

    animate();
    expect(nextRender).not.toHaveBeenCalled();
    animate();
    expect(nextRender).toHaveBeenCalledTimes(1);
  });
  it('executes only the last recurrent render after currently executing one', () => {

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
  it('executes recurrent renders in the same and another schedule after currently executing one', () => {

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
    expect(nextRender2).not.toHaveBeenCalled();

    animate();
    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render in another and the same schedule after currently executing one', () => {

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
    expect(nextRender2).not.toHaveBeenCalled();

    animate();
    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('logs error and executes recurrent render after error', () => {

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
