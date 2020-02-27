import { ManualRenderScheduler, newManualRenderScheduler } from './manual-render-scheduler';
import { RenderSchedule } from './render-schedule';

describe('manualRenderScheduler', () => {

  let scheduler: ManualRenderScheduler;
  let schedule: RenderSchedule;
  let schedule2: RenderSchedule;

  beforeEach(() => {
    scheduler = newManualRenderScheduler();
    schedule = scheduler();
    schedule2 = scheduler();
  });

  describe('render', () => {
    it('returns `false` when no render shots scheduled', () => {
      expect(scheduler.render()).toBe(false);
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

      expect(scheduler.render()).toBe(true);
      expect(shot1).toHaveBeenCalled();
      expect(shot2).not.toHaveBeenCalled();
      expect(shot3).toHaveBeenCalled();

      expect(scheduler.render()).toBe(false);
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

      scheduler.render();
      expect(postponed1).toHaveBeenCalledTimes(1);
      expect(postponed2).toHaveBeenCalledTimes(1);
    });
    it('executes recurrent render shots by next request', () => {

      const shot1 = jest.fn();
      const shot2 = jest.fn();
      const shot3 = jest.fn();
      const shot4 = jest.fn();

      schedule(shot1.mockImplementation(() => {
        schedule2(shot2);
        schedule(shot3);
        schedule(shot4);
      }));

      expect(shot1).not.toHaveBeenCalled();
      expect(shot2).not.toHaveBeenCalled();
      expect(shot3).not.toHaveBeenCalled();
      expect(shot4).not.toHaveBeenCalled();

      expect(scheduler.render()).toBe(true);
      expect(shot1).toHaveBeenCalled();
      expect(shot2).not.toHaveBeenCalled();
      expect(shot3).not.toHaveBeenCalled();
      expect(shot4).not.toHaveBeenCalled();

      expect(scheduler.render()).toBe(true);
      expect(shot2).toHaveBeenCalled();
      expect(shot3).not.toHaveBeenCalled();
      expect(shot4).toHaveBeenCalled();

      expect(scheduler.render()).toBe(false);
      expect(shot1).toHaveBeenCalledTimes(1);
      expect(shot2).toHaveBeenCalledTimes(1);
      expect(shot3).not.toHaveBeenCalled();
      expect(shot4).toHaveBeenCalledTimes(1);
    });
  });
  it('logs errors according to schedule options', () => {

    const logError1 = jest.fn();
    const logError2 = jest.fn();

    schedule = scheduler({ error: logError1 });
    schedule2 = scheduler({ error: logError2 });

    const error = new Error('!');

    schedule(() => { throw error; });
    schedule2(() => { throw error; });

    scheduler.render();
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

    scheduler.render();
    expect(shot1).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining(options1) }));
    expect(shot2).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining(options2) }));
  });
});
