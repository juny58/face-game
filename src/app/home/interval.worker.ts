import { interval } from "rxjs";
let intervalObserver
let intervalSubscriber
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  //console.log(data)
  if (typeof data == 'number') {
    intervalObserver = interval(data)
    intervalSubscriber = intervalObserver.subscribe(() => {
      postMessage(null);
    })
  } else {
    if (intervalSubscriber) {
      intervalSubscriber.unsubscribe()
    }
  }
});
