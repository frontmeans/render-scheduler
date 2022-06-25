import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { immediateRenderScheduler } from './immediate-render-scheduler';

describe('immediateRenderScheduler', () => {

  let errors: unknown[];

  beforeEach(() => {
    errors = [];
  });
  afterEach(() => {
    errors.forEach(e => { throw e; });
  });

  it('renders immediately', () => {

    const shot = jest.fn();

    immediateRenderScheduler()(shot);

    expect(shot).toHaveBeenCalledTimes(1);
  });
  it('executes recurrent render shots immediately', () => {

    const schedule = immediateRenderScheduler();

    schedule(() => {
      try {

        const recurrent = jest.fn();

        schedule(recurrent);
        expect(recurrent).toHaveBeenCalledTimes(1);
      } catch (e) {
        errors.push(e);
      }
    });
  });
  it('reports render shot execution error', () => {

    const logError = jest.fn();
    const error = new Error('test');

    immediateRenderScheduler({ error: logError })(() => { throw error; });
    expect(logError).toHaveBeenCalledWith(error);
  });
  it('sends config to render shots', () => {

    const node = document.createElement('test');

    immediateRenderScheduler({ node })(execution => {
      try {
        expect(execution.config.node).toBe(node);
      } catch (e) {
        errors.push(e);
      }
    });
  });
  it('executes postponed render shots after initiator one', () => {

    const schedule = immediateRenderScheduler();
    const postponed1 = jest.fn();
    const postponed2 = jest.fn();

    schedule(execution => {
      try {
        execution.postpone(postponed1);
        execution.postpone(postponed2.mockImplementation(() => {
          try {
            expect(postponed1).not.toHaveBeenCalled();
          } catch (e) {
            errors.push(e);
          }
        }));
        expect(postponed1).not.toHaveBeenCalled();
      } catch (e) {
        errors.push(e);
      }
    });

    expect(postponed1).toHaveBeenCalledTimes(1);
    expect(postponed2).toHaveBeenCalledTimes(1);
  });
});
