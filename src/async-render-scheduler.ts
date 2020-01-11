/**
 * @module render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

export const asyncRenderScheduler: RenderScheduler =
    (/*#__PURE__*/ customRenderScheduler(task => Promise.resolve().then(task)));
