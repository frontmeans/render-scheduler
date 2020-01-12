import { renderScheduleConfig } from './render-schedule';

describe('renderScheduleConfig', () => {
  describe('window', () => {
    it('is current window by default', () => {
      expect(renderScheduleConfig().window).toBe(window);
    });
    it('respects the window specified', () => {

      const mockWindow = { name: 'window' } as Window;

      expect(renderScheduleConfig({ window: mockWindow }).window).toBe(mockWindow);
    });
    it('accesses the `window` option at most once', () => {

      const mockWindow = { name: 'window' } as Window;
      const getWindow = jest.fn(() => mockWindow);
      const config = renderScheduleConfig({ get window() { return getWindow(); } });

      expect(getWindow).not.toHaveBeenCalled();

      expect(config.window).toBe(mockWindow);
      expect(getWindow).toHaveBeenCalled();

      getWindow.mockImplementation(() => ({ name: 'other' } as Window));
      expect(config.window).toBe(mockWindow);
      expect(getWindow).toHaveBeenCalledTimes(1);
    });
  });
  describe('error', () => {
    it('prints error using `console.error` by default', () => {

      const error = new Error('Expected');
      const errorSpy = jest.spyOn(console, 'error');
      errorSpy.mockImplementation(() => {});

      renderScheduleConfig().error(error);
      expect(errorSpy).toHaveBeenCalledWith(error);

      renderScheduleConfig({}).error(error);
      expect(errorSpy).toHaveBeenLastCalledWith(error);
      expect(errorSpy).toHaveBeenCalledTimes(2);
    });
    it('respect the provided error logger', () => {

      const mockError = jest.fn();
      const error = new Error('Expected');

      renderScheduleConfig({ error: mockError }).error(error);
      expect(mockError).toHaveBeenCalledWith(error);
      expect(mockError).toHaveBeenCalledTimes(1);
    });
  });
});
