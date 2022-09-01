import { CxEntry, cxSingle } from '@proc7ts/context-values';

/**
 * Default window instance.
 */
export type CxWindow = Window & typeof globalThis;

/**
 * Context entry containing default window instance.
 *
 * Defaults to current window.
 */
export const CxWindow: CxEntry<CxWindow> = {
  perContext: /*#__PURE__*/ cxSingle({ byDefault: () => window }),
  toString: () => '[CxWindow]',
};
