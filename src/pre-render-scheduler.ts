import type { CxEntry } from '@proc7ts/context-values';
import { asyncRenderScheduler } from './async-render-scheduler';
import { cxRenderScheduler } from './cx-render-scheduler';
import type { RenderScheduler } from './render-scheduler';

/**
 * Pre-rendering tasks scheduler.
 *
 * This scheduler used when render offline. E.g. when manipulating DOM nodes within a [DocumentFragment].
 *
 * [DocumentFragment]: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
 */
export type PreRenderScheduler = RenderScheduler;

/**
 * Context entry containing {@link PreRenderScheduler} instance.
 *
 * Uses {@link asyncRenderScheduler asynchronous} render scheduler by default.
 */
export const PreRenderScheduler: CxEntry<PreRenderScheduler> = {
  perContext: (/*#__PURE__*/ cxRenderScheduler({ byDefault: _ => asyncRenderScheduler })),
  toString: () => '[PreRenderScheduler]',
};
