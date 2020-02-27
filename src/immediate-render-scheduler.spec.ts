import { immediateRenderScheduler } from './immediate-render-scheduler';
import { RenderSchedule } from './render-schedule';
import Mock = jest.Mock;

describe('immediateRenderScheduler', () => {

  let mockError: Mock<void, [any]>;

  beforeEach(() => {
    mockError = jest.fn();
  });

  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {
    schedule = immediateRenderScheduler({ error: mockError });
    schedule2 = immediateRenderScheduler();
  });

  let errors: any[];

  beforeEach(() => {
    errors = [];
  });
  afterEach(() => {
    errors.forEach(e => { throw e; });
  });

  it('renders immediately', () => {

    const shot = jest.fn();

    schedule(shot);
    expect(shot).toHaveBeenCalledTimes(1);
  });
  it('executes subsequent render shots immediately', () => {

    const shot1 = jest.fn();
    const shot2 = jest.fn();

    schedule(shot1);
    expect(shot1).toHaveBeenCalledTimes(1);
    schedule(shot2);
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
    expect(postponed).toHaveBeenCalledTimes(1);
  });
  it('executes all postponed render shots in order', () => {

    const postponed1 = jest.fn();
    const postponed2 = jest.fn();

    schedule(execution => {
      execution.postpone(ex => ex.postpone(postponed2));
      execution.postpone(
          postponed1.mockImplementation(
              () => {
                try {
                  expect(postponed2).not.toHaveBeenCalled();
                } catch (e) {
                  errors.push(e);
                }
              },
          ),
      );
    });

    expect(postponed1).toHaveBeenCalledTimes(1);
    expect(postponed2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shot after currently executing one', () => {

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
  it('executes only the last recurrent render shot after currently executing one', () => {

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
        expect(nextRender3).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    expect(nextRender1).toHaveBeenCalled();
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

    expect(nextRender1).toHaveBeenCalledTimes(1);
    expect(nextRender2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shot in another and the same schedule after currently executing one', () => {

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

    expect(nextRender).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenCalledWith(error);
  });
});
