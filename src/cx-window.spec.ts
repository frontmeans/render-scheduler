import { describe, expect, it } from '@jest/globals';
import { CxBuilder } from '@proc7ts/context-builder';
import { CxWindow } from './cx-window';

describe('CxWindow', () => {
  it('defaults to window object', () => {

    const context = new CxBuilder(get => ({ get })).context;

    expect(context.get(CxWindow)).toBe(window);
  });

  describe('toString', () => {
    it('returns string representation', () => {
      expect(String(CxWindow)).toBe('[CxWindow]');
    });
  });
});
