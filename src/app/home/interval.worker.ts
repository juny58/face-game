import { interval } from "rxjs";

/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  if (typeof data == 'number') {
    var intervalObserver = interval(data)
    var intervalSubscriber = intervalObserver.subscribe(() => {
      postMessage(null);
    })
  } else {
    intervalSubscriber.unsubscribe()
  }
});
