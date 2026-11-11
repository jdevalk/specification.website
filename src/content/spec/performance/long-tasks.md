---
title: "Long tasks"
slug: long-tasks
category: performance
summary: "Keep main-thread tasks under the 50 ms long-task threshold: break up long work, yield with scheduler.yield(), offload heavy computation to a worker, and attribute what remains with Long Animation Frames in the field."
status: recommended
order: 15
appliesTo: [all]
relatedSlugs: [core-web-vitals, script-loading, visibility-aware-rendering]
updated: "2026-11-11T00:00:00.000Z"
sources:
  - title: "Long Tasks API"
    url: "https://www.w3.org/TR/longtasks-1/"
    publisher: "W3C"
  - title: "web.dev — Optimize long tasks"
    url: "https://web.dev/articles/optimize-long-tasks"
    publisher: "web.dev"
  - title: "MDN — Scheduler.yield()"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield"
    publisher: "MDN"
---

## What it is

A long task is any task that occupies the main thread for more than 50 milliseconds. While it runs, the browser cannot respond to input or paint the response to it — which is why long tasks are the unit [Interaction to Next Paint](/spec/performance/core-web-vitals/) is made of. The 50 ms figure is not an aspiration; it is the platform's own definition, from the Long Tasks API, and the threshold the related Long Animation Frames (LoAF) API reports against.

The misconception is that responsiveness is a property of how *much* JavaScript a page runs. It is a property of how the work is *scheduled*: the same total computation, sliced so the main thread yields between pieces, leaves gaps in which input is handled and frames are painted. Total work determines load; task length determines whether the page feels alive while it happens.

## Why it matters

INP is a Core Web Vital, and its failures are rarely mysterious in retrospect: an event handler that renders a large list synchronously, a third-party script that parses for 300 ms, a hydration pass that never yields. Each is a long task sitting between the user's action and the browser's response. Unlike total bundle size, task length is entirely within the page's control at runtime, on every device class — including the slow phones where a 50 ms task on a desktop becomes 400 ms.

## How to implement

- **Budget by task, not by page.** Nothing synchronous on the main thread should run past 50 ms. As a working heuristic: under 50 ms, run it; 50–250 ms of work, slice it and yield between slices; beyond that, move it off the main thread to a Web Worker.
- **Yield with `scheduler.yield()`.** Awaiting it returns control to the browser so pending input and rendering can run, then resumes your task ahead of lower-priority queued work — unlike `setTimeout(0)`, which rejoins the back of the queue. Check a deadline (`performance.now()` against a 50 ms budget) or an abort signal each iteration rather than yielding on every step; yielding itself is not free. The Scheduler API is not yet universal — Chrome and Edge since version 129, Firefox since 142, Safari has not shipped it — so feature-detect and fall back to a `setTimeout` or message-channel yield.
- **Schedule by priority where you can.** `scheduler.postTask()` with `user-blocking`, `user-visible`, and `background` priorities lets input-critical work jump the queue ahead of analytics and prefetch bookkeeping on the same API surface.
- **Do not create the tasks in the first place.** Defer non-critical scripts (see [script loading](/spec/performance/script-loading/)), split initialisation so first render is not gated on every feature's setup, and keep event handlers thin: record the intent, do the heavy state and DOM work in yielded slices.
- **Measure in the field, not only in the lab.** A lab trace shows your machine's tasks. LoAF entries (`long-animation-frame`, over 50 ms) with their script attribution show your users': aggregate by source in your real-user monitoring and fix the offenders by total blocking contribution, not by count.

## Common mistakes

- Yielding with `setTimeout(0)` and concluding the page is responsive: the continuation queues behind everything else, so under load the work still starves input — it just does so in smaller pieces.
- Breaking up rendering work but not third-party work: tag managers, consent tooling, and chat widgets are frequent top long-task sources and the least examined.
- Treating hydration or initialisation as exempt because it happens "at load": a 2-second blocked main thread during load is also delayed input for the user already trying to scroll or tap.
- Optimising the lab's INP with synthetic clicks while field LoAF data points at different scripts entirely.
- Yielding unconditionally inside hot loops, paying the yield overhead thousands of times for tasks that would have finished within budget unsliced.

## Verification

- In your RUM data, list long-animation-frame entries by script source for real sessions; the top contributors should be known, budgeted, and shrinking.
- Throttle CPU (4–6×) in DevTools and repeat the page's core interactions: input responses stay visibly immediate, with no main-thread task over 50 ms in the trace attributable to first-party code.
- Audit third-party scripts the same way and raise offenders with their vendors, with LoAF attribution as evidence.
- Confirm the yield path feature-detects `scheduler.yield` and that the fallback still caps task length on browsers without it.
