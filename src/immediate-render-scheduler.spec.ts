import { immediateRenderScheduler } from './immediate-render-scheduler';
import { RenderSchedule } from './render-schedule';
import Mock = jest.Mock;

describe('immediateRenderScheduler', () => {

  let mockError: Mock<void, [any]>;

  beforeEach(() => {
    mockError = jest.fn();
  });

  let schedule: RenderSchedule;

  beforeEach(() => {
    schedule = immediateRenderScheduler({ error: mockError });
  });

  let errors: any[];

  beforeEach(() => {
    errors = [];
  });
  afterEach(() => {
    errors.forEach(e => { throw e; });
  });

  it('renders immediately', () => {

    const render = jest.fn();

    schedule(render);
    expect(render).toHaveBeenCalledTimes(1);
  });
  it('executes subsequent renders immediately', () => {

    const render1 = jest.fn();
    const render2 = jest.fn();

    schedule(render1);
    expect(render1).toHaveBeenCalledTimes(1);
    schedule(render2);
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

    expect(postponed1).toHaveBeenCalledTimes(1);
    expect(postponed2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render after currently executing one', () => {

    const nextRender = jest.fn();

    schedule(() => {
      schedule(nextRender);
      try {
        expect(nextRender).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    expect(nextRender).toHaveBeenCalledTimes(1);
  });
  it('executes only the last recurrent render after currently executing one', () => {

    const nextRender1 = jest.fn();
    const nextRender2 = jest.fn();

    schedule(() => {
      schedule(nextRender1);
      schedule(nextRender2);
      try {
        expect(nextRender1).not.toHaveBeenCalled();
        expect(nextRender2).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    expect(nextRender1).not.toHaveBeenCalled();
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('logs error and executes recurrent render after error', () => {

    const error = new Error('Expected');
    const nextRender = jest.fn();

    schedule(() => {
      schedule(nextRender);
      throw error;
    });

    expect(nextRender).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenCalledWith(error);
  });
});
