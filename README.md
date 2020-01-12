DOM Render Scheduler 
====================

[![NPM][npm-image]][npm-url]
[![CircleCI][ci-image]][ci-url]
[![codecov][codecov-image]][codecov-url]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

Schedules DOM updates rendering.

[npm-image]: https://img.shields.io/npm/v/render-scheduler.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/render-scheduler
[ci-image]: https://img.shields.io/circleci/build/github/surol/render-scheduler?logo=circleci
[ci-url]: https://circleci.com/gh/surol/render-scheduler
[codecov-image]: https://codecov.io/gh/surol/render-scheduler/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/surol/render-scheduler
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/surol/render-scheduler
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://surol.github.io/render-scheduler/index.html


Usage
-----

```typescript
import { newRenderSchedule } from 'render-scheduler';

// First, create a rendering schedule.
const btnSchedule = newRenderSchedule();

// Schedule render
btnSchedule(() => document.getElementById('button').disabled = false);

// Schedule another render
// Only the latest render within one schedule will be executed 
btnSchedule(() => document.getElementById('button').disabled = true);

// Each schedule schedules its renders independently from others.
// Yet renders from all schedules for the same window are executed in the same animation frame.
const popupSchedule = newRenderSchedule();

popupSchedule(execution => {
  
  const popup = document.getElementById('popup');

  popup.classList.remove('hidden');
  
  execution.postpone(() => {
    // Postponed render is executed after the rest of them.
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

By default the scheduler executes scheduled renders within animation frame. It utilizes [requestAnimationFrame()]
of current window for that. This implementation is called `animationRenderScheduler`. It helps limit the rate
of DOM manipulations caused by too frequent updates, as only the latest render in the same schedule is executed.

There are few more implementations:

- `asyncRenderScheduler` - executes renders asynchronously,
- `immediateRenderScheduler` - executes renders immediately upon scheduling,
- `ManualRenderScheduler` - executes renders on request,
- `noopRenderScheduler` - neither schedules, not executes renders. 

Render schedulers can be used directly, or set globally with `setRenderScheduler()` function. In the latter case
the `newRenderSchedule()` function would use that scheduler.

Custom scheduler may also be created using `customRenderScheduler()` function.

[requestAnimationFrame()]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame


Schedule Options
----------------

When constructing a new schedule additional options may be specified:

- `window` - a window the schedule is created for.
  `animationRenderScheduler` executes renders for all schedules created for the same window simultaneously,
  in the same animation frame.
  Other implementations ignore this option.
  Defaults to current window.
- `error(...messages: any[])` - a method that will be called when some error occurred.
  E.g. when render execution failed.
  Defaults to `console.error()`.   

