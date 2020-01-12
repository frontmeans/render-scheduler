import { newRenderSchedule, RenderSchedule, RenderScheduler, setRenderScheduler } from './render-scheduler';
import Mock = jest.Mock;

describe('setRenderScheduler', () => {

  let mockScheduler: Mock<ReturnType<RenderScheduler>, Parameters<RenderScheduler>>;
  let mockSchedule: Mock<void, Parameters<RenderSchedule>>;

  beforeEach(() => {
    mockScheduler = jest.fn(_config => mockSchedule);
    mockSchedule = jest.fn();
  });
  afterEach(() => {
    setRenderScheduler();
  });

  it('assigns scheduler', () => {
    expect(setRenderScheduler(mockScheduler)).toBe(mockScheduler);

    const schedule = newRenderSchedule();

    expect(schedule).toBe(mockSchedule);
    expect(mockScheduler).toHaveBeenCalledWith({ window });
  });
});
