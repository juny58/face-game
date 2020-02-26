/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  setInterval(() => {
    postMessage(null);
  }, data)
});
