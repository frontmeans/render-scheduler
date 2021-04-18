import { ManualRenderScheduler, newManualRenderScheduler } from './manual-render-scheduler';
import type { RenderSchedule } from './render-schedule';

describe('manualRenderScheduler', () => {

  let scheduler: ManualRenderScheduler;
  let render: () => boolean;
  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {
    scheduler = newManualRenderScheduler();
    render = scheduler.render;
    schedule = scheduler();
    schedule2 = scheduler();
  });

  it('returns `false` when no render shots scheduled', () => {
    expect(render()).toBe(false);
  });
  it('executes scheduled render shots by request', () => {

    const shot1 = jest.fn();
    const shot2 = jest.fn();
    const shot3 = jest.fn();

    schedule(shot1);
    schedule2(shot2);
    schedule2(shot3);

    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).not.toHaveBeenCalled();

    expect(render()).toBe(true);
    expect(shot1).toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).toHaveBeenCalled();

    expect(render()).toBe(false);
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).toHaveBeenCalledTimes(1);
  });
  it('executes postponed render shots', () => {

    const postponed1 = jest.fn();
    const postponed2 = jest.fn();

    schedule(exec => {
      exec.postpone(postponed1);
      exec.postpone(postponed2);
    });

    expect(postponed1).not.toHaveBeenCalled();
    expect(postponed2).not.toHaveBeenCalled();

    render();
    expect(postponed1).toHaveBeenCalledTimes(1);
    expect(postponed2).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shot in the same schedule by next request', () => {

    const shot1 = jest.fn();
    const shot2 = jest.fn();
    const shot3 = jest.fn();

    schedule(shot1.mockImplementation(() => {
      schedule(shot2);
      schedule(shot3);
    }));

    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).not.toHaveBeenCalled();

    expect(render()).toBe(true);
    expect(shot1).toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).not.toHaveBeenCalled();

    expect(render()).toBe(true);
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).toHaveBeenCalled();

    expect(render()).toBe(false);
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shot in another schedule by the same request', () => {

    const shot1 = jest.fn();
    const shot2 = jest.fn();
    const shot3 = jest.fn();

    schedule(shot1.mockImplementation(() => {
      schedule2(shot2);
      schedule2(shot3);
    }));

    expect(shot1).not.toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).not.toHaveBeenCalled();

    expect(render()).toBe(true);
    expect(shot1).toHaveBeenCalled();
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).toHaveBeenCalled();

    expect(render()).toBe(false);
    expect(shot1).toHaveBeenCalledTimes(1);
    expect(shot2).not.toHaveBeenCalled();
    expect(shot3).toHaveBeenCalledTimes(1);
  });
  it('executes postponed render shots after recurrent ones in another schedule', () => {

    const schedule3 = scheduler();
    const calls: string[] = [];
    const postponed = (): void => {
      calls.push('postponed');
    };
    const recurrent1 = (): void => {
      calls.push('recurrent1');
    };
    const recurrent2 = (): void => {
      calls.push('recurrent2');
    };

    schedule(exec => {
      schedule2(recurrent1);
      exec.postpone(postponed);
      schedule3(recurrent2);
    });

    render();
    expect(calls).toEqual(['recurrent1', 'recurrent2', 'postponed']);
  });
  it('logs errors according to schedule options', () => {

    const logError1 = jest.fn();
    const logError2 = jest.fn();

    schedule = scheduler({ error: logError1 });
    schedule2 = scheduler({ error: logError2 });

    const error = new Error('!');

    schedule(() => { throw error; });
    schedule2(() => { throw error; });

    render();
    expect(logError1).toHaveBeenCalledWith(error);
    expect(logError1).toHaveBeenCalledTimes(1);
    expect(logError2).toHaveBeenCalledWith(error);
    expect(logError2).toHaveBeenCalledTimes(1);
  });
  it('calls render shots with their schedule configs', () => {

    const options1 = { node: document.createElement('div') };
    const options2 = { node: document.createElement('span') };

    schedule = scheduler(options1);
    schedule2 = scheduler(options2);

    const shot1 = jest.fn();
    const shot2 = jest.fn();

    schedule(shot1);
    schedule2(shot2);

    render();
    expect(shot1).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining(options1) }));
    expect(shot2).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining(options2) }));
  });
});
