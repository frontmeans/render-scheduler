import { noopRenderScheduler } from './noop-render-scheduler';
import { RenderSchedule } from './render-schedule';

describe('noopRenderScheduler', () => {

  let schedule: RenderSchedule;

  beforeEach(() => {
    schedule = noopRenderScheduler();
  });

  it('does not schedule', () => {

    const shot = jest.fn();

    schedule(shot);
    expect(shot).not.toHaveBeenCalled();
  });
  it('always returns the same schedule', () => {
    expect(noopRenderScheduler({ window })).toBe(schedule);
  });
});
