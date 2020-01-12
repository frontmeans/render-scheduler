/**
 * @module render-scheduler
 */
export type ScheduledRender = (this: void, execution: ScheduledRenderExecution) => void;

export interface ScheduledRenderExecution {
  readonly window: Window;
  postpone(render: ScheduledRender): void;
}
