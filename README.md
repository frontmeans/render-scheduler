DOM Render Scheduler 
====================

[![NPM][npm-image]][npm-url]
[![CircleCI][ci-image]][ci-url]
[![codecov][codecov-image]][codecov-url]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

Schedules rendering of DOM updates called _render shots_.

[npm-image]: https://img.shields.io/npm/v/@proc7ts/render-scheduler.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@proc7ts/render-scheduler
[ci-image]: https://img.shields.io/circleci/build/github/proc7ts/render-scheduler?logo=circleci
[ci-url]: https://circleci.com/gh/proc7ts/render-scheduler
[codecov-image]: https://codecov.io/gh/proc7ts/render-scheduler/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/proc7ts/render-scheduler
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/proc7ts/render-scheduler
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://proc7ts.github.io/render-scheduler/index.html


Usage
-----

```typescript
import { newRenderSchedule } from '@proc7ts/render-scheduler';

// First, create a rendering schedule
const btnSchedule = newRenderSchedule();

// Schedule render shot
btnSchedule(() => document.getElementById('button').disabled = false);

// Schedule another render shot
// Only the latest render shot within one schedule will be executed 
btnSchedule(() => document.getElementById('button').disabled = true);

// Each schedule schedules its render shots independently from others.
// Yet render shots from all schedules for the same window are executed in the same animation frame.
const popupSchedule = newRenderSchedule();

popupSchedule(execution => {
  
  const popup = document.getElementById('popup');

  popup.classList.remove('hidden');
  
  execution.postpone(() => {
    // Postponed render shot is executed after the rest of them.
    // This is useful when it needs to synchronously request a page reflow,
    // e.g. by requesting of geometry of just updated DOM element.  

    const shadow = document.getElementById('popup-shadow');
    const { clientWidth, clientHeight } = popup;
    
    shadow.classList.remove('hidden');
    shadow.style.width = clientWidth;
    shadow.style.height = clientHeight;
  });
});
```


Scheduler Implementations
-------------------------

By default, a scheduler executes render shots within animation frame. It utilizes [requestAnimationFrame()]
of current window for that. This implementation is called `animationRenderScheduler`. It helps limit the rate
of DOM manipulations caused by too frequent updates, as only the latest render shot in the same schedule is executed.

There is a few more implementations:

- `asyncRenderScheduler` - executes render shots asynchronously,
- `immediateRenderScheduler` - executes render shots immediately,
- `ManualRenderScheduler` - executes render shots on request,
- `noopRenderScheduler` - neither schedules, nor executes render shots,
- `queuedRenderScheduler` - schedules render shots for immediate execution. 

Render schedulers can be used directly, or set globally with `setRenderScheduler()` function. In the latter case
the `newRenderSchedule()` function would use that scheduler.

Custom scheduler may also be created using `customRenderScheduler()` function.

[requestAnimationFrame()]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame


Schedule Options
----------------

When constructing a new schedule additional options may be specified:

- `window` - A window for constructed schedule.
  `animationRenderScheduler` executes render shots for all schedules created for the same window simultaneously,
  in the same animation frame.
  Other implementations ignore this option.
  Defaults to the window of the `node`, or to the current one.
- `node` - A DOM node for constructed schedule.
  Used to detect missing `window` option.
- `error(...messages: any[])` - a method that will be called when some error occurred.
  E.g. when render shot execution failed.
  Defaults to `console.error()`.   

