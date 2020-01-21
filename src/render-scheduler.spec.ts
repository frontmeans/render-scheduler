import { RenderSchedule, RenderScheduleOptions } from './render-schedule';
import { newRenderSchedule, RenderScheduler, setRenderScheduler } from './render-scheduler';
import Mock = jest.Mock;

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

  it('assigns scheduler', () => {
    expect(setRenderScheduler(mockScheduler)).toBe(mockScheduler);

    const options: RenderScheduleOptions = { window };
    const schedule = newRenderSchedule(options);

    expect(schedule).toBe(mockSchedule);
    expect(mockScheduler).toHaveBeenCalledWith(options);
  });
});
