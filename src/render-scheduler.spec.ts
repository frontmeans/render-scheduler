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

  it('assigns scheduler to current window by default', () => {
    setRenderScheduler(mockScheduler);

    const schedule = newRenderSchedule();

    expect(schedule).toBe(mockSchedule);
    expect(mockScheduler).toHaveBeenCalledWith({ window });
  });
  it('reassigns scheduler', () => {

    const mockScheduler2 = jest.fn<ReturnType<RenderScheduler>, Parameters<RenderScheduler>>(_config => mockSchedule2);
    const mockSchedule2 = jest.fn();

    setRenderScheduler(mockScheduler);
    setRenderScheduler(mockScheduler2);

    const schedule = newRenderSchedule();

    expect(schedule).toBe(mockSchedule2);
    expect(mockScheduler2).toHaveBeenCalledWith({ window });
  });
});
