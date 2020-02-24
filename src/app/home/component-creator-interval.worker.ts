/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  setInterval(() => {
    let rand = Math.random()
    let val
    if (rand > 0.5) {
      val = 1
    } else {
      val = 2
    }
    postMessage(val);
  }, 4000)
});
