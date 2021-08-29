import { nodeWindow } from '@frontmeans/dom-primitives';
import { CxEntry, cxRecent, CxTracker, cxUnavailable } from '@proc7ts/context-values';
import { CxWindow } from './cx-window';
import { newDelegateRenderScheduler } from './delegate-render-scheduler';
import { newRenderSchedule } from './new-render-scheduler';
import { noopRenderScheduler } from './noop-render-scheduler';
import type { RenderScheduler } from './render-scheduler';
import type { RenderExecution } from './render-shot';

/**
 * Creates context entry definer containing {@link RenderScheduler render scheduler}.
 *
 * Uses the most recently provided render scheduler. Sets {@link RenderSchedule.Options.window window} option for the
 * scheduler to {@link CxWindow contextual window} unless explicitly specified.
 *
 * @param byDefault - Creates render scheduler to use by default. {@link newRenderSchedule Default one} used when
 * omitted.
 *
 * @returns New context entry definer.
 */
export function cxRenderScheduler(
    {
      byDefault = _ => newRenderSchedule,
    }: {
      byDefault?: ((this: void, target: CxEntry.Target<RenderScheduler>) => RenderScheduler) | undefined;
    } = {},
): CxEntry.Definer<RenderScheduler> {
  return cxRecent({
    create: (recent: RenderScheduler, _target: CxEntry.Target<RenderScheduler>) => recent,
    byDefault,
    assign({ track, to }: CxTracker.Mandatory<RenderScheduler>, target: CxEntry.Target<RenderScheduler>) {

      const cxWindow = target.get(CxWindow);
      const delegate = newDelegateRenderScheduler<RenderExecution>(noopRenderScheduler);

      track(scheduler => delegate.scheduleBy(scheduler))
          .whenOff(reason => delegate.scheduleBy(cxUnavailable(target.entry, undefined, reason)));

      const scheduler: RenderScheduler = (options = {}) => {

        const { node, window = node ? nodeWindow(node) : cxWindow } = options;

        return delegate({
          ...options,
          window,
        });
      };

      return receiver => to((_, by) => receiver(scheduler, by));
    },
  });
}
