import type { RenderShot } from './render-shot';

/**
 * @internal
 */
export function noopRenderSchedule(_shot: RenderShot<never>): void {
  // Do not schedule
}
