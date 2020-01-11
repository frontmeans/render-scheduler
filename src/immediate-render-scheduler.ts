/**
 * @module render-scheduler
 */
import { customRenderScheduler } from './custom-render-scheduler';
import { RenderScheduler } from './render-scheduler';

export const immediateRenderScheduler: RenderScheduler =
    (/*#__PURE__*/ customRenderScheduler(task => task()));
