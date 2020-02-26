/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  let compFn = () => {
    let rand = Math.random()
    let val
    if (rand > 0.5) {
      val = 1
    } else {
      val = 2
    }
    postMessage(val);
  }
  setInterval(() => {
    compFn()
  }, data)
});