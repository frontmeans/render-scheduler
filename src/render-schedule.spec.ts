import { describe, expect, it, jest } from '@jest/globals';
import { RenderScheduleConfig } from './render-schedule';

describe('RenderScheduleConfig', () => {
  describe('window', () => {
    it('is current window by default', () => {
      expect(RenderScheduleConfig.by().window).toBe(window);
    });
    it('respects the window specified', () => {

      const mockWindow = { name: 'window' } as Window;

      expect(RenderScheduleConfig.by({ window: mockWindow }).window).toBe(mockWindow);
    });
    it('is detected by `node`', () => {

      const mockWindow = { name: 'window' } as Window;
      const mockNode = { ownerDocument: { defaultView: mockWindow } } as Node;

      expect(RenderScheduleConfig.by({ node: mockNode }).window).toBe(mockWindow);
    });
    it('is detected by document `node`', () => {

      const mockWindow = { name: 'window' } as Window;
      const mockNode = { defaultView: mockWindow } as Document;

      expect(RenderScheduleConfig.by({ node: mockNode }).window).toBe(mockWindow);
    });
    it('accesses the `window` option at most once', () => {

      const mockWindow = { name: 'window' } as Window;
      const getWindow = jest.fn(() => mockWindow);
      const config = RenderScheduleConfig.by({ get window() { return getWindow(); } });

      expect(getWindow).not.toHaveBeenCalled();

      expect(config.window).toBe(mockWindow);
      expect(getWindow).toHaveBeenCalled();

      getWindow.mockImplementation(() => ({ name: 'other' } as Window));
      expect(config.window).toBe(mockWindow);
      expect(getWindow).toHaveBeenCalledTimes(1);
    });
  });
  describe('node', () => {
    it('is undefined by default', () => {
      expect(RenderScheduleConfig.by().node).toBeUndefined();
    });
    it('is the one specified', () => {

      const node = document.createElement('dev');

      expect(RenderScheduleConfig.by({ node }).node).toBe(node);
    });
  });
  describe('error', () => {
    it('prints error using `console.error` by default', () => {

      const error = new Error('Expected');
      const errorSpy = jest.spyOn(console, 'error');

      errorSpy.mockImplementation(() => {/* noop */});

      RenderScheduleConfig.by().error(error);
      expect(errorSpy).toHaveBeenCalledWith(error);

      RenderScheduleConfig.by({}).error(error);
      expect(errorSpy).toHaveBeenLastCalledWith(error);
      expect(errorSpy).toHaveBeenCalledTimes(2);
    });
    it('respect the provided error logger', () => {

      const mockError = jest.fn();
      const error = new Error('Expected');

      RenderScheduleConfig.by({ error: mockError }).error(error);
      expect(mockError).toHaveBeenCalledWith(error);
      expect(mockError).toHaveBeenCalledTimes(1);
    });
  });
});
